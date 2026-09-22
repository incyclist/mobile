import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

/**
 * Persists REST log batches that failed to send, so that a POST failure (a crash racing the
 * flush timeout, a dropped connection, a backend outage) does not lose the events for good.
 *
 * RestLogAdapter.send() removes events from its in-memory queue before the request goes out,
 * so once the request fails there is nowhere left in memory to recover them from - without
 * this, they are simply gone. This store gives them one more place to live: on next app
 * start, initRestLogging() drains it and replays the entries into the fresh adapter, the same
 * way it already replays the pre-adapter-startup backlog (see BacklogAdapter).
 *
 * Backed directly by react-native-mmkv - mirroring the direct `createMMKV` usage in
 * `bindings/db/mmkv.ts` rather than the async `AbstractJsonRepositoryBinding` wrapper also
 * built on it. That wrapper's extra microtask tick is not something a write this close to a
 * crash (CrashReporting's fatal handler) can rely on completing before the process dies;
 * MMKV's get/set/remove are synchronous native calls, which is the whole point of using it
 * here.
 */

export const MAX_FALLBACK_ENTRIES = 200;
const STORAGE_KEY = 'entries';
const STORAGE_ID = 'restlog_fallback';

export type FallbackEntry = {
    context: string;
    event: any;
};

export class RestLogFallbackStore {
    protected storage: MMKV;
    protected maxEntries: number;

    constructor(maxEntries: number = MAX_FALLBACK_ENTRIES, id: string = STORAGE_ID) {
        this.maxEntries = maxEntries;
        this.storage = createMMKV({ id });
    }

    protected readAll(): FallbackEntry[] {
        try {
            const raw = this.storage.getString(STORAGE_KEY);
            if (!raw)
                return [];

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    protected writeAll(entries: FallbackEntry[]): void {
        this.storage.set(STORAGE_KEY, JSON.stringify(entries));
    }

    /**
     * Appends a failed batch to the store, synchronously, dropping the oldest entries first
     * once the cap is exceeded - the same bounding convention BacklogAdapter uses. Returns how
     * many of the given events ended up persisted (normally all of them; a single batch large
     * enough to exceed the cap on its own is not expected in practice, but is handled safely).
     */
    persist(events: FallbackEntry[]): number {
        if (!events || events.length === 0)
            return 0;

        try {
            const combined = this.readAll().concat(events);
            const trimmed = combined.length > this.maxEntries
                ? combined.slice(combined.length - this.maxEntries)
                : combined;

            this.writeAll(trimmed);

            return Math.min(events.length, this.maxEntries);
        } catch {
            return 0;
        }
    }

    /**
     * Returns everything persisted so far and clears the store. Safe to call more than once;
     * later calls return nothing.
     */
    drain(): FallbackEntry[] {
        try {
            const entries = this.readAll();
            this.storage.remove(STORAGE_KEY);
            return entries;
        } catch {
            return [];
        }
    }

    get size(): number {
        return this.readAll().length;
    }
}

let fallbackStore: RestLogFallbackStore | undefined;

export const getRestLogFallbackStore = (): RestLogFallbackStore => {
    fallbackStore = fallbackStore ?? new RestLogFallbackStore();
    return fallbackStore;
};

/** Test only. */
export const resetRestLogFallbackStore = (): void => {
    fallbackStore = undefined;
};
