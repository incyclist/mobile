import RNFS from 'react-native-fs';
import { Platform } from 'react-native'
import { EventEmitter } from 'events';
import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import path from 'path-browserify';
import { IDownloadManager, IDownloadSession, DownloadProps } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';

export class MobileDownloadSession extends EventEmitter implements IDownloadSession {
    private task?: any;
    private lastUpdate: number = 0;
    private lastBytes: number = 0;
    private stopped: boolean = false;
    private logger = new EventLogger('MobileDownloadSession')

    constructor(private url: string, private fileName: string) {
        super();
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
                    destination: this.fileName,
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
                this.emit('done', `video:///${this.fileName}`);
            })
            .error(({ error, errorCode }: { error: string, errorCode: number }) => {
                this.logger.logEvent({message: 'DownloadSession error', url: this.url, error, errorCode})
                if (this.stopped) return;
                this.emit('error', new Error(error));
            })

        this.logger.logEvent({message: 'DownloadSession start download', url: this.url})

        this.task.start()
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
