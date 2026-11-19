import {
    KeyValueStore,
    LogDeliveryMarker,
    PreviousSession,
    SessionSnapshot,
    SessionStateRecorder,
    readPreviousSession,
} from './sessionRecord';

export const DEFAULT_TICK_MS = 5000;
export const LOG_RATE_INTERVAL_MS = 60_000;

export interface SessionDiagnosticsDeps {
    store: KeyValueStore;
    now?: () => number;
    logEvent: (event: Record<string, any>) => void;
    flushLogs: () => Promise<void> | void;
    getAppState: () => string;
    getSnapshot: () => SessionSnapshot;
    /** Total number of events logged so far in this process (monotonic). */
    getEventCount: () => number;
    tickMs?: number;
}

/**
 * Diagnostics for abrupt session endings. Every public method swallows its own failures, so
 * nothing in here can affect startup or a ride.
 */
export class SessionDiagnostics {
    protected recorder: SessionStateRecorder;
    protected marker: LogDeliveryMarker;
    protected now: () => number;
    protected timer: ReturnType<typeof setInterval> | undefined;
    protected lastSampleAt = 0;
    protected lastSampleCount = 0;
    protected wasRiding = false;

    constructor(protected deps: SessionDiagnosticsDeps) {
        this.now = deps.now ?? Date.now;
        this.recorder = new SessionStateRecorder(deps.store, this.now);
        this.marker = new LogDeliveryMarker(deps.store, this.now);
    }

    /** Reports on the previous session, then starts recording this one. */
    start(): void {
        try {
            const previous = readPreviousSession(this.deps.store);
            const lastDelivered = this.marker.lastDelivered();
            this.reportPrevious(previous, lastDelivered);
        } catch {
            // ignore
        }

        try {
            const snapshot = this.deps.getSnapshot();
            this.recorder.begin({ appState: this.deps.getAppState(), ...snapshot });
            this.wasRiding = snapshot.rideState === 'riding';
            this.lastSampleAt = this.now();
            this.lastSampleCount = this.deps.getEventCount();

            this.stop();
            this.timer = setInterval(() => this.tick(), this.deps.tickMs ?? DEFAULT_TICK_MS);
        } catch {
            // ignore
        }
    }

    stop(): void {
        if (this.timer !== undefined) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    /** Called on every AppState transition. */
    onAppStateChange(next: string): void {
        try {
            this.recorder.setAppState(next);
        } catch {
            // ignore
        }

        if (next === 'active')
            return;

        // The 10 s batching would otherwise lose the transition if the process is killed
        // shortly after the app left the foreground.
        try {
            Promise.resolve(this.deps.flushLogs()).catch(() => { /* ignore */ });
        } catch {
            // ignore
        }
    }

    /** Called on the orderly exit path only. */
    markClean(): void {
        try {
            this.stop();
            this.recorder.markClean();
        } catch {
            // ignore
        }
    }

    protected tick(): void {
        try {
            this.recorder.setAppState(this.deps.getAppState());
            const snapshot = this.deps.getSnapshot();
            this.recorder.refresh(snapshot);
            this.sampleLogRate(snapshot.rideState === 'riding');
        } catch {
            // ignore
        }
    }

    protected sampleLogRate(riding: boolean): void {
        const now = this.now();
        const count = this.deps.getEventCount();

        if (!riding || !this.wasRiding) {
            // first sample of a ride should cover a full window
            this.wasRiding = riding;
            this.lastSampleAt = now;
            this.lastSampleCount = count;
            return;
        }

        const elapsed = now - this.lastSampleAt;
        if (elapsed < LOG_RATE_INTERVAL_MS)
            return;

        const windowSec = Math.round(elapsed / 1000);
        const logRate = Math.round(((count - this.lastSampleCount) / (elapsed / 1000)) * 10) / 10;
        this.lastSampleAt = now;
        this.lastSampleCount = count;

        this.deps.logEvent({ message: 'log rate', logRate, windowSec, appState: this.deps.getAppState() });
    }

    protected reportPrevious(previous: PreviousSession, lastDelivered: number | undefined): void {
        if (previous.status === 'unparseable') {
            this.deps.logEvent({ message: 'previous session state unknown', reason: 'unparseable' });
            return;
        }

        if (previous.status !== 'abnormal')
            return;

        const { record } = previous;
        const event: Record<string, any> = {
            message: 'previous session ended abnormally',
            prevAppState: record.appState,
            backgroundSec: record.backgroundSec,
            prevPage: record.page,
            prevRideState: record.rideState,
            prevRecordTs: record.ts,
            prevRecordAgeSec: Math.max(0, Math.round((this.now() - record.ts) / 1000)),
        };

        if (lastDelivered !== undefined) {
            event.lastDeliveredTs = lastDelivered;
            event.recordNewerThanLastDelivery = record.ts > lastDelivered;
        }

        this.deps.logEvent(event);
    }
}
