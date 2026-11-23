import RNFS from 'react-native-fs';
import { Platform } from 'react-native'
import { EventEmitter } from 'events';
import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import path from 'path-browserify';
import { IDownloadManager, IDownloadSession, DownloadProps } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';

const moduleLogger = (): EventLogger => new EventLogger('MobileDownload');

// logging itself must never throw
const logError = (err: any, fn: string, logger: EventLogger = moduleLogger()): void => {
    try {
        logger.logEvent({message: 'error', fn, error: scrubLogText(String(err?.message ?? err)), stack: err?.stack});
    } catch {
        // nothing left to report to
    }
};

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
    try {
        if (filePath.startsWith('/')) {
            return `video://${filePath}`;
        }
        if (/^[A-Za-z]:[/\\]/.test(filePath)) {
            return `video:///${filePath}`;
        }
        return `video://${filePath}`;
    }
    catch (err: any) {
        logError(err, 'buildVideoUrl');
        return '';
    }
}

const PRIVATE_IPV4 = /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/;

const isPrivateHost = (host: string): boolean => {
    try {
        const h = host.toLowerCase().replace(/^\[|\]$/g, '');
        return h === 'localhost' || h.endsWith('.local') || PRIVATE_IPV4.test(h)
            || h === '::1' || /^(fc|fd|fe80)/.test(h) || (!h.includes('.') && !h.includes(':'));
    }
    catch (err: any) {
        logError(err, 'isPrivateHost');
        return true; // unknown host: treat as private so that it is not logged
    }
};

/**
 * Returns a form of a URL that is safe to write to logs: no query string, fragment or userinfo.
 * For http(s) URLs on private/loopback hosts (e.g. the local-link media listener, whose URL carries
 * a media token and the LAN address) the host is omitted too and only the path shape is kept,
 * without the handle value: `/v/<redacted>`.
 */
export const toLogSafeUrl = (url: string | undefined): string => {
    try {
        if (!url) return '';
        const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)/i.exec(url);
        if (!m) return url.split(/[?#]/)[0];
        const scheme = m[1].toLowerCase();
        const host = m[2].slice(m[2].lastIndexOf('@') + 1);
        const hostname = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
        const pathname = m[3];
        if ((scheme === 'http' || scheme === 'https') && isPrivateHost(hostname)) {
            const segments = pathname.split('/').filter(Boolean);
            return segments.length === 0 ? '/' : '/' + [segments[0], ...segments.slice(1).map(() => '<redacted>')].join('/');
        }
        return `${scheme}://${host}${pathname}`;
    }
    catch (err: any) {
        logError(err, 'toLogSafeUrl');
        return '';
    }
};

/** Replaces URLs (and stray `t=` token values) in free text, e.g. an error message, by their log-safe form. */
export const scrubLogText = (text: string): string => {
    try {
        return text
            .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"<>)\]]+/gi, (u) => toLogSafeUrl(u))
            .replace(/([?&;\s]t=)[^&\s'"]+/g, '$1<redacted>');
    }
    catch {
        // not logged here: logError scrubs its text with this function
        return '';
    }
};

// Android DownloadManager.ERROR_INSUFFICIENT_SPACE
const ANDROID_ERROR_INSUFFICIENT_SPACE = 1006;
const OUT_OF_SPACE_TEXT = /ENOSPC|no space|not enough (space|storage)|out of space|NSFileWriteOutOfSpace/i;

/**
 * Makes a failed transfer recognisable as "the device is full": the native layers report that
 * differently (an Android error code, an ENOSPC errno text, an iOS NSFileWriteOutOfSpace error),
 * and the caller classifies on the message only.
 */
export const toDownloadError = (error: unknown, errorCode?: number): Error => {
    try {
        const raw = typeof error === 'string' ? error : (error as Error | undefined)?.message ?? '';
        // the native message may embed the request URL (media token, LAN address): it gets logged/emitted
        const message = scrubLogText(raw);
        if (errorCode === ANDROID_ERROR_INSUFFICIENT_SPACE && !OUT_OF_SPACE_TEXT.test(message))
            return new Error(`no space left on device (code ${errorCode}) ${message}`.trim());
        if (error instanceof Error && message === raw) return error;
        return new Error(message);
    }
    catch (err: any) {
        logError(err, 'toDownloadError');
        return new Error('download failed');
    }
};

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
    private readonly logUrl: string;

    private progressLoggedAt = 0;

    constructor(private url: string, private fileName: string) {
        super();
        this.tempFileName = `${fileName}.part`;
        this.logUrl = toLogSafeUrl(url);
    }

    protected logError(err: any, fn: string): void {
        logError(err, `MobileDownloadSession.${fn}`, this.logger);
    }

    // An 'error' event without a listener (or a throwing listener) must never escape into the
    // native callback that triggered it.
    private safeEmit(event: string, ...args: any[]): void {
        try {
            if (event === 'error' && this.listenerCount('error') === 0) {
                this.logError(args[0], 'emit.unhandled-error');
                return;
            }
            this.emit(event, ...args);
        }
        catch (err: any) {
            this.logError(err, `emit.${event}`);
        }
    }

    public start(): void {
        try {
            this.logger.logEvent({message: 'DownloadSession start', url: this.logUrl})

            if (this.task) {
                this.attachHandlers();
                return;
            }

            const videoDir = path.parse(this.fileName).dir

            RNFS.mkdir(videoDir)
                .then(() => this.onDirReady())
                .catch((err) => {
                    this.logError(err, 'start.mkdir');
                    this.safeEmit('error', toDownloadError(err));
                });
        }
        catch (err: any) {
            this.logError(err, 'start');
            this.safeEmit('error', toDownloadError(err));
        }
    }

    private onDirReady(): void {
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
    }

    public stop(): void {
        try {
            this.logger.logEvent({message: 'DownloadSession stop', url: this.logUrl})
            this.stopped = true;
            if (this.task) {
                this.task.stop();
            }
        }
        catch (err: any) {
            this.logError(err, 'stop');
        }
        this.removeTempFile();
        this.safeEmit('stopped')
    }

    private attachHandlers(): void {
        try {
            if (!this.task) return;

            this.task
                .begin(() => this.onBegin())
                .progress((p: { bytesDownloaded: number, bytesTotal: number }) => this.onProgress(p))
                .done(() => this.onDone())
                .error((e: { error: string, errorCode: number }) => this.onError(e))

            this.logger.logEvent({message: 'DownloadSession start download', url: this.logUrl})

            this.task.start()
        }
        catch (err: any) {
            this.logError(err, 'attachHandlers');
            this.safeEmit('error', toDownloadError(err));
        }
    }

    private onBegin(): void {
        try {
            this.logger.logEvent({message: 'DownloadSession download has started', url: this.logUrl})
            if (this.stopped) return;
            this.safeEmit('started');
        }
        catch (err: any) {
            this.logError(err, 'onBegin');
        }
    }

    private onProgress(p: { bytesDownloaded: number, bytesTotal: number }): void {
        try {
            const { bytesDownloaded, bytesTotal } = p;
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
            if (now - this.progressLoggedAt > 10000) {
                this.logger.logEvent({message: 'DownloadSession progress', pct, speed, bytesDownloaded})
                this.progressLoggedAt = now
            }
            this.safeEmit('progress', pct, speed, bytesDownloaded);
        }
        catch (err: any) {
            this.logError(err, 'onProgress');
        }
    }

    private onDone(): void {
        try {
            this.logger.logEvent({message: 'DownloadSession done', url: this.logUrl})
            if (this.stopped) return;
            this.finalizeDownload().catch((err: any) => this.logError(err, 'onDone'));
        }
        catch (err: any) {
            this.logError(err, 'onDone');
        }
    }

    private onError(e: { error: string, errorCode: number }): void {
        try {
            const { error, errorCode } = e;
            this.logger.logEvent({message: 'DownloadSession error', url: this.logUrl, error: scrubLogText(String(error)), errorCode})
            if (this.stopped) return;
            this.safeEmit('error', toDownloadError(error, errorCode));
        }
        catch (err: any) {
            this.logError(err, 'onError');
        }
    }

    // A stopped transfer must not leave its partial file behind: only the destination is known to
    // the caller, so the temp file is ours to remove.
    private removeTempFile(): void {
        try {
            RNFS.unlink(this.tempFileName).catch(() => { /* nothing was written yet */ });
        }
        catch (err: any) {
            this.logError(err, 'removeTempFile');
        }
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

            this.logger.logEvent({message: 'DownloadSession finalized', url: this.logUrl, fileName: this.fileName})
            this.safeEmit('done', buildVideoUrl(this.fileName));
        }
        catch (err: any) {
            this.logError(err, 'finalizeDownload');
            this.safeEmit('error', toDownloadError(err));
        }
    }
}

export class MobileDownloadManager implements IDownloadManager {
    protected logger = new EventLogger('DownloadManager')

    public createSession(url: string, fileName: string, _props?: DownloadProps): IDownloadSession {
        try {
            this.logger.logEvent({message: 'DownloadManager createSession', url: toLogSafeUrl(url), fileName})
        }
        catch (err: any) {
            logError(err, 'MobileDownloadManager.createSession', this.logger);
        }
        // the session constructor only derives strings; it is the one place that has no safe fallback
        return new MobileDownloadSession(url, fileName);
    }

    public async getFreeSpace(volumePath?: string): Promise<number | undefined> {
        try {
            // react-native-fs reports the volume of the app's storage, which is where the videos go
            const info = await RNFS.getFSInfo();
            const free = info?.freeSpace;
            this.logger.logEvent({message: 'DownloadManager getFreeSpace', path: volumePath, freeBytes: free})
            return typeof free === 'number' && free >= 0 ? free : undefined;
        }
        catch (err: any) {
            logError(err, 'MobileDownloadManager.getFreeSpace', this.logger);
            return undefined;
        }
    }

    public getVideoDir(): string {
        try {
            this.logger.logEvent({message: 'DownloadManager getVideoDir'})
            return getDownloadVideoDir()
        }
        catch (err: any) {
            logError(err, 'MobileDownloadManager.getVideoDir', this.logger);
            return ''
        }
    }
}


export const getDownloadVideoDir = ():string =>  {
    try {
        const logger = new EventLogger('DownloadManager')

        const videoDir = (Platform.OS === 'android'
            ? RNFS.ExternalDirectoryPath
            : RNFS.DocumentDirectoryPath) + '/videos'

        logger.logEvent({message: 'getDownloadVideoDir', platform: Platform.OS, videoDir})
        return videoDir
    }
    catch (err: any) {
        logError(err, 'getDownloadVideoDir')
        return ''
    }
}
