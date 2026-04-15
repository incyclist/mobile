import RNFS from 'react-native-fs';
import { EventEmitter } from 'events';
import { createDownloadTask, getExistingDownloadTasks } from '@kesha-antonov/react-native-background-downloader';
import path from 'path-browserify';
import { IDownloadManager, IDownloadSession, DownloadProps } from 'incyclist-services';

export class MobileDownloadSession extends EventEmitter implements IDownloadSession {
    private task?: any;
    private lastUpdate: number = 0;
    private lastBytes: number = 0;
    private stopped: boolean = false;

    constructor(private url: string, private fileName: string) {
        super();
    }

    public start(): void {
        if (this.task) {
            this.attachHandlers();
            return;
        }

        const videoDir = RNFS.DocumentDirectoryPath + '/videos';
        RNFS.mkdir(videoDir)
            .then(() => {
                if (this.stopped) {
                    return;
                }

                // Use the route ID (filename without extension) as the task ID
                const id = path.parse(this.fileName).name;

                this.task = createDownloadTask({
                    id,
                    url: this.url,
                    destination: this.fileName,
                    metadata: {},
                });

                this.attachHandlers();
            })
            .catch((err) => {
                this.emit('error', err);
            });
    }

    public stop(): void {
        this.stopped = true;
        if (this.task) {
            this.task.stop();
        }
    }

    private attachHandlers(): void {
        if (!this.task) {
            return;
        }

        this.task.begin(({ expectedBytes }: { expectedBytes: number }) => {
            if (this.stopped) {
                return;
            }
            this.emit('started');
        })
        .progress(({ bytesDownloaded, bytesTotal }: { bytesDownloaded: number, bytesTotal: number }) => {
            if (this.stopped) {
                return;
            }

            const now = Date.now();
            let speed = '0.0 MB/s';
            if (this.lastUpdate > 0) {
                const duration = (now - this.lastUpdate) / 1000;
                if (duration > 0) {
                    const bps = (bytesDownloaded - this.lastBytes) / duration;
                    const mbps = bps / 1024 / 1024;
                    speed = `${mbps.toFixed(1)} MB/s`;
                }
            }

            this.lastUpdate = now;
            this.lastBytes = bytesDownloaded;

            const pct = bytesTotal > 0 ? ((bytesDownloaded / bytesTotal) * 100).toFixed(1) : '0.0';
            
            this.emit('progress', pct, speed, bytesDownloaded);
        })
        .done(() => {
            if (this.stopped) {
                return;
            }
            // Prefix with video:/// as expected by RouteCard.onDownloadCompleted
            this.emit('done', `video:///${this.fileName}`);
        })
        .error((error: any) => {
            if (this.stopped) {
                return;
            }
            this.emit('error', error);
        });
    }
}

export class MobileDownloadManager implements IDownloadManager {
    public createSession(url: string, fileName: string, _props?: DownloadProps): IDownloadSession {
        return new MobileDownloadSession(url, fileName);
    }

    /**
     * Reconnects to an existing background task after app restart.
     */
    public async getActiveSession(sessionId: string): Promise<IDownloadSession | null> {
        const tasks = await getExistingDownloadTasks();
        const task = tasks.find(t => t.id === sessionId);
        
        if (task) {
            const session = new MobileDownloadSession(task.url, task.destination);
            // Inject existing task and attach handlers
            (session as any).task = task;
            (session as any).attachHandlers();
            return session;
        }
        
        return null;
    }

    /**
     * Returns the fixed video directory for mobile.
     */
    public getVideoDir(): string {
        return RNFS.DocumentDirectoryPath + '/videos';
    }
}