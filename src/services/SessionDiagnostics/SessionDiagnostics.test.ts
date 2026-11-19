import { SessionDiagnostics, SessionDiagnosticsDeps } from './SessionDiagnostics';
import { KeyValueStore, RECORD_KEY, SessionStateRecorder } from './sessionRecord';

const createStore = (): KeyValueStore => {
    const data = new Map<string, string>();
    return {
        getString: (key: string) => data.get(key),
        set: (key: string, value: string) => { data.set(key, value); },
    };
};

describe('SessionDiagnostics', () => {
    let store: KeyValueStore;
    let time: number;
    let appState: string;
    let snapshot: { page: string; rideState: 'none' | 'riding' };
    let eventCount: number;
    let logEvent: jest.Mock;
    let flush: jest.Mock;

    const create = (overrides: Partial<SessionDiagnosticsDeps> = {}) =>
        new SessionDiagnostics({
            store,
            now: () => time,
            logEvent,
            flushLogs: flush,
            getAppState: () => appState,
            getSnapshot: () => snapshot,
            getEventCount: () => eventCount,
            tickMs: 5000,
            ...overrides,
        });

    beforeEach(() => {
        jest.useFakeTimers();
        store = createStore();
        time = 1_000_000;
        appState = 'active';
        snapshot = { page: 'devices', rideState: 'none' };
        eventCount = 0;
        logEvent = jest.fn();
        flush = jest.fn().mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('previous session', () => {
        it('logs nothing when there is no record', () => {
            create().start();
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('logs nothing after a clean exit', () => {
            const rec = new SessionStateRecorder(store, () => 10);
            rec.begin({ appState: 'active', page: 'exit', rideState: 'none' });
            rec.markClean();

            create().start();
            expect(logEvent).not.toHaveBeenCalled();
        });

        it('logs one abnormal-end event with the previous state', () => {
            time = 900_000;
            const rec = new SessionStateRecorder(store, () => time);
            rec.begin({ appState: 'active', page: 'rideDeviceOK', rideState: 'riding' });
            time = 900_000 + 10_000;
            rec.setAppState('background');
            time = 900_000 + 70_000;
            rec.refresh({ page: 'rideDeviceOK', rideState: 'riding' });
            const recordTs = 970_000;
            store.set('lastDeliveredTs', String(recordTs - 4000));

            time = 2_000_000;
            create().start();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
                message: 'previous session ended abnormally',
                prevAppState: 'background',
                backgroundSec: 60,
                prevPage: 'rideDeviceOK',
                prevRideState: 'riding',
                prevRecordTs: recordTs,
                prevRecordAgeSec: 1030,
                lastDeliveredTs: recordTs - 4000,
                recordNewerThanLastDelivery: true,
            }));
        });

        it('reports record not newer than the last delivery', () => {
            const rec = new SessionStateRecorder(store, () => 500);
            rec.begin({ appState: 'active', page: 'a', rideState: 'none' });
            store.set('lastDeliveredTs', '900');

            create().start();
            expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
                recordNewerThanLastDelivery: false,
            }));
        });

        it('leaves the delivery comparison out when no delivery was ever recorded', () => {
            const rec = new SessionStateRecorder(store, () => 500);
            rec.begin({ appState: 'active', page: 'a', rideState: 'none' });

            create().start();
            const event = logEvent.mock.calls[0][0];
            expect(event).not.toHaveProperty('recordNewerThanLastDelivery');
            expect(event).not.toHaveProperty('lastDeliveredTs');
        });

        it('logs an unknown-state event for an unparseable record', () => {
            store.set(RECORD_KEY, '{garbage');
            create().start();

            expect(logEvent).toHaveBeenCalledTimes(1);
            expect(logEvent).toHaveBeenCalledWith({ message: 'previous session state unknown', reason: 'unparseable' });
        });

        it('overwrites the old record with a fresh unclean one', () => {
            const rec = new SessionStateRecorder(store, () => 5);
            rec.begin({ appState: 'active', page: 'a', rideState: 'none' });
            rec.markClean();

            create().start();
            expect(JSON.parse(store.getString(RECORD_KEY) as string)).toMatchObject({ clean: false, ts: time });
        });
    });

    describe('app state changes', () => {
        it('flushes logs on every change away from active', () => {
            const d = create();
            d.start();

            d.onAppStateChange('inactive');
            d.onAppStateChange('background');
            expect(flush).toHaveBeenCalledTimes(2);

            d.onAppStateChange('active');
            expect(flush).toHaveBeenCalledTimes(2);
        });

        it('records the new state', () => {
            const d = create();
            d.start();
            time += 1000;
            d.onAppStateChange('background');
            expect(JSON.parse(store.getString(RECORD_KEY) as string)).toMatchObject({ appState: 'background' });
        });

        it('survives a failing flush', async () => {
            flush.mockRejectedValue(new Error('x'));
            const d = create();
            d.start();
            expect(() => d.onAppStateChange('background')).not.toThrow();
            await Promise.resolve();
        });

        it('survives a throwing flush', () => {
            flush.mockImplementation(() => { throw new Error('x'); });
            const d = create();
            d.start();
            expect(() => d.onAppStateChange('background')).not.toThrow();
        });
    });

    describe('ticks', () => {
        it('refreshes the record every 30 s during a ride', () => {
            snapshot = { page: 'rideDeviceOK', rideState: 'riding' };
            create().start();
            const first = JSON.parse(store.getString(RECORD_KEY) as string);

            time += 5000;
            jest.advanceTimersByTime(5000);
            expect(JSON.parse(store.getString(RECORD_KEY) as string).ts).toBe(first.ts);

            time += 25_000;
            jest.advanceTimersByTime(25_000);
            expect(JSON.parse(store.getString(RECORD_KEY) as string).ts).toBe(time);
        });

        it('picks up an app state change that was missed', () => {
            const d = create();
            d.start();
            appState = 'background';
            time += 5000;
            jest.advanceTimersByTime(5000);
            expect(JSON.parse(store.getString(RECORD_KEY) as string)).toMatchObject({ appState: 'background' });
            d.stop();
        });

        it('logs a log-rate sample per minute during a ride only', () => {
            snapshot = { page: 'rideDeviceOK', rideState: 'riding' };
            create().start();

            eventCount = 1200;
            time += 60_000;
            jest.advanceTimersByTime(60_000);

            const samples = logEvent.mock.calls.map(c => c[0]).filter(e => e.message === 'log rate');
            expect(samples).toHaveLength(1);
            expect(samples[0]).toEqual({ message: 'log rate', logRate: 20, windowSec: 60, appState: 'active' });
        });

        it('does not log a log-rate sample outside of a ride', () => {
            create().start();
            eventCount = 5000;
            time += 120_000;
            jest.advanceTimersByTime(120_000);
            expect(logEvent.mock.calls.filter(c => c[0].message === 'log rate')).toHaveLength(0);
        });

        it('does not let a throwing dependency escape the timer', () => {
            const d = create({ getSnapshot: () => { throw new Error('x'); } });
            d.start();
            expect(() => jest.advanceTimersByTime(10_000)).not.toThrow();
        });
    });

    describe('clean exit', () => {
        it('marks the record clean and stops ticking', () => {
            const d = create();
            d.start();
            d.markClean();
            expect(JSON.parse(store.getString(RECORD_KEY) as string).clean).toBe(true);

            snapshot = { page: 'rideDeviceOK', rideState: 'riding' };
            time += 60_000;
            jest.advanceTimersByTime(60_000);
            expect(JSON.parse(store.getString(RECORD_KEY) as string).clean).toBe(true);
        });
    });

    it('never throws from start when logging or storage fail', () => {
        logEvent.mockImplementation(() => { throw new Error('x'); });
        const rec = new SessionStateRecorder(store, () => 5);
        rec.begin({ appState: 'active', page: 'a', rideState: 'none' });
        expect(() => create().start()).not.toThrow();
    });
});
