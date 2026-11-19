import {
    KeyValueStore,
    LogDeliveryMarker,
    SessionStateRecorder,
    readPreviousSession,
    RECORD_KEY,
} from './sessionRecord';

const createStore = (): KeyValueStore & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return {
        data,
        getString: (key: string) => data.get(key),
        set: (key: string, value: string) => { data.set(key, value); },
    };
};

const readRecord = (store: KeyValueStore) => JSON.parse(store.getString(RECORD_KEY) as string);

describe('SessionStateRecorder', () => {
    let store: ReturnType<typeof createStore>;
    let time: number;
    const now = () => time;

    beforeEach(() => {
        store = createStore();
        time = 1_000_000;
    });

    it('writes an unclean record on begin', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'devices', rideState: 'none' });

        expect(readRecord(store)).toEqual({
            v: 1, clean: false, appState: 'active', backgroundSec: 0,
            page: 'devices', rideState: 'none', ts: 1_000_000,
        });
    });

    it('tracks seconds in background and resets when active again', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'rideDeviceOK', rideState: 'riding' });

        time += 5000;
        rec.setAppState('inactive');
        expect(readRecord(store).backgroundSec).toBe(0);

        time += 10_000;
        rec.setAppState('background');
        expect(readRecord(store)).toMatchObject({ appState: 'background', backgroundSec: 10 });

        time += 30_000;
        rec.refresh({ page: 'rideDeviceOK', rideState: 'riding' });
        expect(readRecord(store)).toMatchObject({ appState: 'background', backgroundSec: 40 });

        time += 1000;
        rec.setAppState('active');
        expect(readRecord(store)).toMatchObject({ appState: 'active', backgroundSec: 0 });
    });

    it('refreshes at most every 30 s while riding', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'rideSimulate', rideState: 'riding' });
        const first = store.getString(RECORD_KEY);

        time += 29_000;
        rec.refresh({ page: 'rideSimulate', rideState: 'riding' });
        expect(store.getString(RECORD_KEY)).toBe(first);

        time += 1000;
        rec.refresh({ page: 'rideSimulate', rideState: 'riding' });
        expect(readRecord(store).ts).toBe(time);
    });

    it('writes immediately when the ride state changes', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'routes', rideState: 'none' });

        time += 1000;
        rec.refresh({ page: 'rideDeviceOK', rideState: 'riding' });
        expect(readRecord(store)).toMatchObject({ page: 'rideDeviceOK', rideState: 'riding', ts: time });
    });

    it('does not write on unchanged refresh outside of a ride', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'routes', rideState: 'none' });
        const first = store.getString(RECORD_KEY);

        time += 120_000;
        rec.refresh({ page: 'routes', rideState: 'none' });
        expect(store.getString(RECORD_KEY)).toBe(first);
    });

    it('marks the record clean', () => {
        const rec = new SessionStateRecorder(store, now);
        rec.begin({ appState: 'active', page: 'exit', rideState: 'none' });
        rec.markClean();
        expect(readRecord(store).clean).toBe(true);
    });

    it('does not throw when the store fails', () => {
        const broken: KeyValueStore = {
            getString: () => { throw new Error('x'); },
            set: () => { throw new Error('x'); },
        };
        const rec = new SessionStateRecorder(broken, now);
        expect(() => rec.begin({ appState: 'active', page: 'a', rideState: 'none' })).not.toThrow();
        expect(() => rec.setAppState('background')).not.toThrow();
        expect(() => rec.refresh({ page: 'a', rideState: 'riding' })).not.toThrow();
        expect(() => rec.markClean()).not.toThrow();
    });
});

describe('readPreviousSession', () => {
    it('reports missing when nothing was stored', () => {
        expect(readPreviousSession(createStore())).toEqual({ status: 'missing' });
    });

    it('reports unparseable for garbage', () => {
        const store = createStore();
        store.set(RECORD_KEY, '{not json');
        expect(readPreviousSession(store)).toEqual({ status: 'unparseable' });
    });

    it('reports unparseable for a record with the wrong shape', () => {
        const store = createStore();
        store.set(RECORD_KEY, JSON.stringify({ v: 1, clean: 'yes' }));
        expect(readPreviousSession(store)).toEqual({ status: 'unparseable' });
    });

    it('reports unparseable when the store throws', () => {
        const broken: KeyValueStore = { getString: () => { throw new Error('x'); }, set: jest.fn() };
        expect(readPreviousSession(broken)).toEqual({ status: 'unparseable' });
    });

    it('reports clean and abnormal records', () => {
        const store = createStore();
        const rec = new SessionStateRecorder(store, () => 5);
        rec.begin({ appState: 'background', page: 'rideDeviceOK', rideState: 'riding' });

        const abnormal = readPreviousSession(store);
        expect(abnormal.status).toBe('abnormal');

        rec.markClean();
        expect(readPreviousSession(store).status).toBe('clean');
    });
});

describe('LogDeliveryMarker', () => {
    it('returns undefined before anything was delivered', () => {
        expect(new LogDeliveryMarker(createStore(), () => 1).lastDelivered()).toBeUndefined();
    });

    it('stores and reads the delivery time', () => {
        const store = createStore();
        new LogDeliveryMarker(store, () => 42).markDelivered();
        expect(new LogDeliveryMarker(store, () => 99).lastDelivered()).toBe(42);
    });

    it('ignores garbage and store failures', () => {
        const store = createStore();
        store.set('lastDeliveredTs', 'abc');
        expect(new LogDeliveryMarker(store, () => 1).lastDelivered()).toBeUndefined();

        const broken: KeyValueStore = { getString: () => { throw new Error('x'); }, set: () => { throw new Error('x'); } };
        const marker = new LogDeliveryMarker(broken, () => 1);
        expect(() => marker.markDelivered()).not.toThrow();
        expect(marker.lastDelivered()).toBeUndefined();
    });
});
