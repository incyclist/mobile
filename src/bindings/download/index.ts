import RNFS from 'react-native-fs';
import { Platform } from 'react-native'
import { EventEmitter } from 'events';
import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import path from 'path-browserify';
import { IDownloadManager, IDownloadSession, DownloadProps } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';

/**
 * Builds a `video://` URL for a given file path, using the correct number of
 * slashes depending on whether the path is absolute or relative.
 *
 * Mirrors `buildVideoUrl()` in `incyclist-services` (services/src/routes/base/parsers/utils.ts) —
 * kept as a local copy here since this file is always given an OS-absolute
 * path (fileName is destination on the device filesystem) and the two
 * packages don't currently share this helper across the npm boundary.
 *
 * - Windows absolute paths (`C:\path` / `C:/path`) have no leading slash of
 *   their own, so the prefix needs all 3 slashes explicitly: `video:///C:\path`
 * - Unix absolute paths (`/path`) already contribute their own leading slash,
 *   so only 2 explicit slashes are needed: `video://` + `/path` = `video:///path`
 * - Relative paths use 2 explicit slashes and contribute no leading slash of
 *   their own: `video://./path`
 */
export const buildVideoUrl = (filePath: string): string => {
    if (filePath.startsWith('/')) {
        return `video://${filePath}`;
    }
    if (/^[A-Za-z]:[/\\]/.test(filePath)) {
        return `video:///${filePath}`;
    }
    return `video://${filePath}`;
}

export class MobileDownloadSession extends EventEmitter implements IDownloadSession {
    private task?: any;
    private lastUpdate: number = 0;
    private lastBytes: number = 0;
    private stopped: boolean = false;
    private logger = new EventLogger('MobileDownloadSession')
    // Download to a temp path rather than the real destination directly.
    //
    // @kesha-antonov/react-native-background-downloader (v4.5.4, still present on
    // its main branch as of this writing) has a bug where its native stopTask()
    // helper (RNBackgroundDownloaderModuleImpl.kt) is invoked both for genuine
    // cancellation *and* on the successful-completion path (after the
    // MediaScannerConnection.scanFile callback) - and stopTask() unconditionally
    // calls DownloadManager.remove(downloadId), which per its documented contract
    // deletes the underlying file. Every "successful" download this library
    // routes through Android's DownloadManager therefore gets its own file
    // deleted ~130ms after completion.
    //
    // We can't patch the library (would need patch-package for every install and
    // every user hitting the same bug), so instead we decouple the physical file
    // from DownloadManager's bookkeeping entirely: download to a temp path that
    // DownloadManager knows about and is free to delete, then move the finished
    // file to the real destination ourselves in the 'done' handler. By the time
    // the buggy cleanup runs, the temp path is already empty/gone and the real
    // bytes live somewhere DownloadManager has no record of.
    private readonly tempFileName: string;

    constructor(private url: string, private fileName: string) {
        super();
        this.tempFileName = `${fileName}.part`;
    }

    public start(): void {
        this.logger.logEvent({message: 'DownloadSession start', url: this.url})

        if (this.task) {
            this.attachHandlers();
            return;
        }

        const videoDir = path.parse(this.fileName).dir


        RNFS.mkdir(videoDir)
            .then(() => {
                if (this.stopped) return;

                const id = path.parse(this.fileName).name;
                this.task = createDownloadTask({
                    id,
                    url: this.url,
                    destination: this.tempFileName,
                    metadata: {},
                    isAllowedOverRoaming: true,
                    isAllowedOverMetered: true,
                })

                this.attachHandlers();
            })
            .catch((err) => {
                this.logger.logEvent({message: 'DownloadSession mkdir error', error: err.message})
                this.emit('error', err);
            });
    }

    public stop(): void {
        this.logger.logEvent({message: 'DownloadSession stop', url: this.url})
        this.stopped = true;
        if (this.task) {
            this.task.stop();
        }
        this.emit('stopped')
    }

    private attachHandlers(): void {
        if (!this.task) return;

        let ts=0, prev=0

        this.task
            .begin(({ expectedBytes: _expectedBytes }: { expectedBytes: number }) => {
                this.logger.logEvent({message: 'DownloadSession download has started', url: this.url})
                if (this.stopped) return;
                this.emit('started');
            })
            .progress(({ bytesDownloaded, bytesTotal }: { bytesDownloaded: number, bytesTotal: number }) => {
                if (this.stopped) return;

                const now = Date.now();
                let speed = '0.0 MB/s';
                if (this.lastUpdate > 0) {
                    const duration = (now - this.lastUpdate) / 1000;
                    if (duration > 0) {
                        const bps = (bytesDownloaded - this.lastBytes) / duration;
                        speed = `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
                    }
                }
                this.lastUpdate = now;
                this.lastBytes = bytesDownloaded;

                const pct = bytesTotal > 0
                    ? ((bytesDownloaded / bytesTotal) * 100).toFixed(1)
                    : '0.0';

                // log progress only every 10 seconds
                ts = Date.now()
                if (ts-prev>10000) {                
                    this.logger.logEvent({message: 'DownloadSession progress', pct, speed, bytesDownloaded})
                    prev = ts
                }
                this.emit('progress', pct, speed, bytesDownloaded);
            })
            .done(() => {
                this.logger.logEvent({message: 'DownloadSession done', url: this.url})
                if (this.stopped) return;
                this.finalizeDownload();
            })
            .error(({ error, errorCode }: { error: string, errorCode: number }) => {
                this.logger.logEvent({message: 'DownloadSession error', url: this.url, error, errorCode})
                if (this.stopped) return;
                this.emit('error', new Error(error));
            })

        this.logger.logEvent({message: 'DownloadSession start download', url: this.url})

        this.task.start()
    }

    // Relocates the completed download from the temp path to the real
    // destination - see the comment on `tempFileName` above for why this is
    // necessary. Deterministic (not a race against the library's cleanup
    // timing), since DownloadManager only ever knows about the temp path.
    private async finalizeDownload(): Promise<void> {
        try {
            // A previous attempt may have already left a file at the real
            // destination (the old direct-download code implicitly overwrote
            // it) - remove it first so re-downloads still behave as a clean
            // overwrite.
            if (await RNFS.exists(this.fileName)) {
                await RNFS.unlink(this.fileName);
            }

            await RNFS.moveFile(this.tempFileName, this.fileName);

            this.logger.logEvent({message: 'DownloadSession finalized', url: this.url, fileName: this.fileName})
            this.emit('done', buildVideoUrl(this.fileName));
        }
        catch (err: any) {
            this.logger.logEvent({message: 'DownloadSession finalize error', url: this.url, error: err.message})
            this.emit('error', err);
        }
    }
}

export class MobileDownloadManager implements IDownloadManager {
    protected logger = new EventLogger('DownloadManager')

    public createSession(url: string, fileName: string, _props?: DownloadProps): IDownloadSession {
        this.logger.logEvent({message: 'DownloadManager createSession', url, fileName})
        return new MobileDownloadSession(url, fileName);
    }

    public getVideoDir(): string {
        this.logger.logEvent({message: 'DownloadManager getVideoDir'})
        return getDownloadVideoDir()
    }
}


export const getDownloadVideoDir = ():string =>  {

    const logger = new EventLogger('DownloadManager')

    const videoDir = (Platform.OS === 'android'
        ? RNFS.ExternalDirectoryPath
        : RNFS.DocumentDirectoryPath) + '/videos'


    logger.logEvent({message: 'getDownloadVideoDir', platform: Platform.OS, videoDir})
    return videoDir
}
