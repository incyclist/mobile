import { BaseAdapter, LogAdapter } from 'gd-eventlog';

/**
 * Retains early log events so they can be handed to an adapter that registers later.
 *
 * The REST adapter cannot be registered at startup: it needs `logRest.url` and
 * `logRest.sendInterval`, which are only known after the settings have loaded. Everything
 * logged before that point reaches the console adapter but never reaches the server -
 * `EventLogger` hands each event to whichever adapters exist at that moment and then drops
 * it, so there is nothing left to replay by the time the REST adapter appears.
 *
 * This adapter is registered first, at startup, purely to keep a copy. Once the REST
 * adapter is up, `drain()` hands the backlog over and retention stops, so this costs
 * nothing for the rest of the session.
 *
 * The alternative - delaying startup until logging is ready - was rejected deliberately:
 * it would make unrelated subsystems wait on logging, whereas this lets logging catch up
 * with what already happened.
 */

export const MAX_BACKLOG_ENTRIES = 200;

export type BacklogEntry = {
    context: string;
    event: any;
};

export class BacklogAdapter extends BaseAdapter implements LogAdapter {
    protected entries: BacklogEntry[] = [];
    protected retaining: boolean = true;
    protected maxEntries: number;

    constructor(maxEntries: number = MAX_BACKLOG_ENTRIES) {
        super();
        this.maxEntries = maxEntries;
    }

    log(context: string, event: any): void {
        if (!this.retaining || context === undefined || event === undefined) {
            return;
        }

        try {
            // Copied, not referenced: adapters are free to mutate the event they are given
            // (the console adapter deletes keys off it), and each adapter receives its own
            // filtered copy, so holding on to this one is only safe if it is ours.
            this.entries.push({ context, event: { ...event } });

            // Bounded so that a session where the REST adapter never registers - logging
            // disabled, or a failure during init - cannot grow this without limit.
            if (this.entries.length > this.maxEntries) {
                this.entries.shift();
            }
        } catch {
            // logging must never throw into the caller
        }
    }

    /**
     * Returns everything retained so far and stops retaining. Safe to call more than once;
     * later calls return nothing.
     */
    drain(): BacklogEntry[] {
        const entries = this.entries;
        this.stop();
        return entries;
    }

    /** Stops retaining and releases anything held, without handing it over. */
    stop(): void {
        this.retaining = false;
        this.entries = [];
    }

    get size(): number {
        return this.entries.length;
    }

    get isRetaining(): boolean {
        return this.retaining;
    }
}

let backlog: BacklogAdapter | undefined;

export const getLogBacklog = (): BacklogAdapter => {
    backlog = backlog ?? new BacklogAdapter();
    return backlog;
};

/** Test only. */
export const resetLogBacklog = (): void => {
    backlog = undefined;
};
