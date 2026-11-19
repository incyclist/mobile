/**
 * Small persisted record describing the state of the running session, used on the next start
 * to tell whether the previous process ended in an orderly way.
 *
 * Everything here is pure with respect to storage and clock (both injected) and never throws:
 * diagnostics must not be able to affect startup or a ride.
 */

export const RECORD_KEY = 'record';
export const DELIVERED_KEY = 'lastDeliveredTs';
export const MIN_RIDE_REFRESH_MS = 30_000;

export interface KeyValueStore {
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
}

export type RideState = 'none' | 'riding';

export interface SessionRecord {
    v: 1;
    clean: boolean;
    appState: string;
    backgroundSec: number;
    page: string;
    rideState: RideState;
    ts: number;
}

export interface SessionSnapshot {
    page: string;
    rideState: RideState;
}

export type PreviousSession =
    | { status: 'missing' }
    | { status: 'unparseable' }
    | { status: 'clean'; record: SessionRecord }
    | { status: 'abnormal'; record: SessionRecord };

const isRecord = (value: any): value is SessionRecord =>
    value !== null &&
    typeof value === 'object' &&
    value.v === 1 &&
    typeof value.clean === 'boolean' &&
    typeof value.appState === 'string' &&
    typeof value.backgroundSec === 'number' &&
    typeof value.page === 'string' &&
    (value.rideState === 'none' || value.rideState === 'riding') &&
    typeof value.ts === 'number';

export const readPreviousSession = (store: KeyValueStore): PreviousSession => {
    let raw: string | undefined;
    try {
        raw = store.getString(RECORD_KEY);
    } catch {
        return { status: 'unparseable' };
    }

    if (raw === undefined || raw === null || raw === '')
        return { status: 'missing' };

    try {
        const parsed = JSON.parse(raw);
        if (!isRecord(parsed))
            return { status: 'unparseable' };
        return { status: parsed.clean ? 'clean' : 'abnormal', record: parsed };
    } catch {
        return { status: 'unparseable' };
    }
};

export class SessionStateRecorder {
    protected appState = 'active';
    protected leftActiveAt: number | undefined;
    protected page = '';
    protected rideState: RideState = 'none';
    protected lastWrite = 0;

    constructor(
        protected store: KeyValueStore,
        protected now: () => number = Date.now,
        protected minRideRefreshMs: number = MIN_RIDE_REFRESH_MS,
    ) {}

    begin(props: { appState: string } & SessionSnapshot): void {
        this.appState = props.appState;
        this.leftActiveAt = props.appState === 'active' ? undefined : this.now();
        this.page = props.page;
        this.rideState = props.rideState;
        this.write(false);
    }

    setAppState(appState: string): void {
        if (appState === this.appState)
            return;

        this.appState = appState;
        if (appState === 'active')
            this.leftActiveAt = undefined;
        else
            this.leftActiveAt = this.leftActiveAt ?? this.now();

        this.write(false);
    }

    /**
     * Cheap to call often: only writes when the ride state changed, when the page changed
     * outside of a ride, or when a ride has gone at least `minRideRefreshMs` without a write.
     */
    refresh(snapshot: SessionSnapshot): void {
        const rideChanged = snapshot.rideState !== this.rideState;
        const pageChanged = snapshot.page !== this.page;

        this.page = snapshot.page;
        this.rideState = snapshot.rideState;

        const due = this.rideState === 'riding' && this.now() - this.lastWrite >= this.minRideRefreshMs;
        if (rideChanged || due || (pageChanged && this.rideState !== 'riding'))
            this.write(false);
    }

    markClean(): void {
        this.write(true);
    }

    protected write(clean: boolean): void {
        try {
            const ts = this.now();
            const backgroundSec = this.leftActiveAt === undefined
                ? 0
                : Math.max(0, Math.floor((ts - this.leftActiveAt) / 1000));

            const record: SessionRecord = {
                v: 1,
                clean,
                appState: this.appState,
                backgroundSec,
                page: this.page,
                rideState: this.rideState,
                ts,
            };
            this.store.set(RECORD_KEY, JSON.stringify(record));
            this.lastWrite = ts;
        } catch {
            // diagnostics must never throw into the app
        }
    }
}

/** Remembers when the log pipeline last confirmed delivery of a batch. */
export class LogDeliveryMarker {
    constructor(
        protected store: KeyValueStore,
        protected now: () => number = Date.now,
    ) {}

    markDelivered(): void {
        try {
            this.store.set(DELIVERED_KEY, String(this.now()));
        } catch {
            // ignore
        }
    }

    lastDelivered(): number | undefined {
        try {
            const raw = this.store.getString(DELIVERED_KEY);
            if (!raw)
                return undefined;
            const value = Number(raw);
            return Number.isFinite(value) ? value : undefined;
        } catch {
            return undefined;
        }
    }
}
