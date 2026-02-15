import { BaseAdapter, EventLogger } from 'gd-eventlog';
import { ApiClient  } from '../../../services';

export const DEFAULT_SEND_INTERVAL = 10; 
export const DEFAULT_REST_LOG_URL = 'https://analytics.test.incyclist.com/api/v1'

export type RestLogAdapterProps = {
    url?: string;
    cacheDir?: string;
    sendInterval?: number;
};

export class RestLogAdapter extends BaseAdapter {
    protected cacheDir: string | undefined;
    protected iv: NodeJS.Timeout|undefined;
    protected inMemoryCache: Array<{context: string; event: any}>;
    protected sendInterval: number;
    protected sendBusy: boolean;
    protected headers: any;
    protected logger: EventLogger;
    protected api: ApiClient;

    constructor(opts: RestLogAdapterProps = {}) {
        super();

        this.logger = new EventLogger('RestLogAdapter');

        // set defaults
        this.cacheDir = undefined;
        this.iv = undefined;
        this.inMemoryCache = [];
        this.sendInterval = DEFAULT_SEND_INTERVAL * 1000;
        this.sendBusy = false;
        this.headers = undefined;

        // copy parameters from opts
        this.cacheDir = opts.cacheDir;
        this.sendInterval = (opts.sendInterval ?? DEFAULT_SEND_INTERVAL) * 1000;

        this.api = new ApiClient();
        this.api.setUrl(opts.url??DEFAULT_REST_LOG_URL)
        
        this.logger.logEvent({message: 'New RestLogAdapter', opts});

        this.iv = this.startWorker(this.sendInterval);
    }

    log(context: string, event: any) {
        if (context === undefined || event === undefined) {
            return;
        }

        try {
            this.inMemoryCache.push({context, event});
        } catch  { }
    }

    stop() {
        if (this.iv !== undefined) {
            clearInterval(this.iv);
            this.iv = undefined;
            this.send(true);
        }
    }

    protected startWorker(ms: number):NodeJS.Timeout|undefined {
        if (ms) {
            return setInterval(() => {
                this.send();
            }, ms);
        }
    }

    protected async flush() {
        try {
            return await this.send(true);
        } catch (error) {
            const err = error as Error;
            console.log(err.message, err.stack);
        }
    }

    loadFromMemoryCache(events: Array<{context: string; event: any}>) {
        if (!events || !Array.isArray(events)) {
            throw new Error('Illegal Arguments: events must be an array');
        }

        let cnt = events.push(...this.inMemoryCache);
        this.inMemoryCache = this.inMemoryCache.slice(cnt);
    }

    send(ignoreBusy = false) {
        return new Promise(resolve => {
            let stats = {processed: 0, mem: this.inMemoryCache.length, file: 0};

            if (this.sendBusy && !ignoreBusy) {
                return resolve(stats);
            }

            this.sendBusy = true;

            let events: Array<{context: string; event: any}> = [];
            this.loadFromMemoryCache(events);

            if (events.length === 0) {
                this.sendBusy = false;
                return resolve(stats);
            }

            this.api
                .post('/log', {events})
                .then((res: any) => {
                    stats.mem = this.inMemoryCache.length;

                    let processed = 0;
                    processed = stats.processed = res.count ?? 0;

                    if (processed !== events.length) {
                        // trigger resending of events
                        this.inMemoryCache = this.inMemoryCache.concat(events);
                        stats.mem += events.length;
                    }

                    this.sendBusy = false;
                    return resolve(stats);
                })
                .catch((err: Error) => {
                    try {
                        /*
                    if ( err.response !== undefined) {
                        const fName = path.join( os.tmpdir(), `./failed_logs-${Date.now()}`);
                        this.logger.logEvent( {message:'could not send',events:fName,status:err.response.status,statusText:err.response.statusText});
                        fs.writeFileSync( fName,JSON.stringify(events));
                    }
                    else {
                        this.logger.logEvent( {message:'could not send',events:fName,errno:err.errno,code:err.code});
                        fs.writeFileSync( fName,JSON.stringify(events));
                    }
                    */
                        console.log('could not send', err.message, err.stack);
                    } catch {}

                    this.sendBusy = false;
                    resolve({
                        processed: 0,
                        mem: this.inMemoryCache.length,
                        file: 0,
                    });
                });
        });
    }
}


