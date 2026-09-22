// Covers the handover of early startup events to the REST adapter. The REST adapter cannot
// be registered until the settings have loaded, so anything logged before that - which is
// most of app startup - used to reach the console and nothing else.

const mockSettings: Record<string, any> = {};
const mockAdapters: any[] = [];

jest.mock('../IncyclistApi', () => ({
    ApiConfiguration: { getInstance: () => ({ addHeader: jest.fn() }) },
}));

jest.mock('react-native-mmkv', () => {
    const stores = new Map<string, Map<string, string>>();

    return {
        createMMKV: ({ id }: { id: string }) => {
            if (!stores.has(id))
                stores.set(id, new Map());
            const store = stores.get(id)!;

            return {
                getString: (key: string) => store.get(key),
                set: (key: string, value: string) => { store.set(key, value); },
                remove: (key: string) => {
                    const had = store.has(key);
                    store.delete(key);
                    return had;
                },
                getAllKeys: () => Array.from(store.keys()),
            };
        },
    };
});

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('../../bindings/appInfo', () => ({
    getAppInfoBinding: async () => ({
        getAppVersion: () => '1.2.3',
        getUIVersion: () => '0.1.1',
        session: 'test-session',
    }),
    getChannel: () => 'mobile',
}));

jest.mock('../../bindings/user-settings', () => ({
    getUserSettingsBinding: () => ({
        getAll: async () => mockSettings,
        get: (key: string, defValue: any) => mockSettings[key] ?? defValue,
        getValue: (key: string, defValue: any) => mockSettings[key] ?? defValue,
    }),
}));

jest.mock('../../bindings/logging/Adapters/RestLogAdapter', () => ({
    RestLogAdapter: class {
        log = jest.fn();
        send = jest.fn();
        stop = jest.fn();
        constructor() { mockAdapters.push(this); }
    },
}));

import { EventLogger } from 'gd-eventlog';
import { initRestLogging } from './RestLogging';
import { getLogBacklog, resetLogBacklog } from '../../bindings/logging/Adapters/BacklogAdapter';
import { getRestLogFallbackStore, resetRestLogFallbackStore } from '../../bindings/logging/Adapters/RestLogFallbackStore';

describe('initRestLogging - early event handover', () => {

    beforeEach(() => {
        EventLogger.reset();
        resetLogBacklog();
        resetRestLogFallbackStore();
        mockAdapters.length = 0;
        Object.keys(mockSettings).forEach((key) => delete mockSettings[key]);
        mockSettings.uuid = 'test-uuid';
    });

    // Mirrors what Loader.tsx does at startup, well before the settings are available.
    const startupLogging = () => {
        EventLogger.registerAdapter(getLogBacklog());
    };

    const replayed = () => mockAdapters[0].log.mock.calls.map(([context, event]: any[]) => ({ context, event }));

    it('hands events logged before it existed to the REST adapter', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'mqtt connected', uri: 'wss://host/ws' });

        await initRestLogging();

        expect(replayed()).toContainEqual(expect.objectContaining({
            context: 'mq',
            event: expect.objectContaining({ message: 'mqtt connected', uri: 'wss://host/ws' }),
        }));
    });

    it('gives replayed events the globals every other line carries', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'mqtt connected');
        expect(entry.event).toMatchObject({
            version: '0.1.1',
            appVersion: '1.2.3',
            uuid: 'test-uuid',
            session: 'test-session',
            'app-channel': 'mobile',
        });
    });

    it('does not mark replayed events - they are ordinary startup events, not a special kind', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'mqtt connected');
        expect(entry.event.replayed).toBeUndefined();
    });

    it('sets session and app-channel up front, not only once services initialises', async () => {
        startupLogging();

        await initRestLogging();

        // A live event logged straight after init - i.e. long before services sets its own
        // globals - must already be correlatable to a session.
        mockAdapters[0].log.mockClear();
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        const [, event] = mockAdapters[0].log.mock.calls[0];
        expect(event).toMatchObject({ session: 'test-session', 'app-channel': 'mobile' });
    });

    it('preserves the original timestamp, so late arrival does not reorder the log', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'mqtt connected');
        expect(entry.event.ts).toBeDefined();
        expect(new Date(entry.event.ts).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('applies the same filter live events are subject to', async () => {
        startupLogging();
        new EventLogger('Requests').logEvent({ message: 'GET /something' });
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        await initRestLogging();

        const contexts = replayed().map((e: any) => e.context);
        expect(contexts).toContain('mq');
        expect(contexts).not.toContain('Requests');
    });

    it('stops retaining once handed over, so the backlog costs nothing afterwards', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'early' });

        await initRestLogging();

        expect(getLogBacklog().isRetaining).toBe(false);

        new EventLogger('mq').logEvent({ message: 'later' });
        expect(getLogBacklog().size).toBe(0);
    });

    it('releases the backlog when rest logging is disabled, rather than holding it forever', async () => {
        mockSettings['logRest.enabled'] = false;

        startupLogging();
        new EventLogger('mq').logEvent({ message: 'early' });

        await initRestLogging();

        expect(mockAdapters).toHaveLength(0);
        expect(getLogBacklog().isRetaining).toBe(false);
        expect(getLogBacklog().size).toBe(0);
    });

    it('reports how many events were recovered', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'one' });
        new EventLogger('mq').logEvent({ message: 'two' });

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'Logging initialiazed');
        expect(entry.event.replayed).toBe(2);
    });
});

// Covers the second recovery path: events that made it past the backlog handover, into a live
// RestLogAdapter, but were then lost mid-session because their send() failed (crash, dropped
// connection, backend outage) and got persisted to disk instead of memory. Those only surface
// again on the next app start, once a fresh adapter exists to replay them into.
describe('initRestLogging - fallback store replay', () => {

    beforeEach(() => {
        EventLogger.reset();
        resetLogBacklog();
        resetRestLogFallbackStore();
        mockAdapters.length = 0;
        Object.keys(mockSettings).forEach((key) => delete mockSettings[key]);
        mockSettings.uuid = 'test-uuid';
    });

    const replayed = () => mockAdapters[0].log.mock.calls.map(([context, event]: any[]) => ({ context, event }));

    it('replays a batch persisted by a previous session into the fresh adapter', async () => {
        getRestLogFallbackStore().persist([
            { context: 'Incyclist', event: { message: 'crash in main window', isFatal: true } },
        ]);

        await initRestLogging();

        expect(replayed()).toContainEqual(expect.objectContaining({
            context: 'Incyclist',
            event: expect.objectContaining({ message: 'crash in main window', isFatal: true }),
        }));
    });

    it('applies the current session globals to replayed fallback events', async () => {
        getRestLogFallbackStore().persist([
            { context: 'Incyclist', event: { message: 'crash in main window' } },
        ]);

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'crash in main window');
        expect(entry.event).toMatchObject({
            version: '0.1.1',
            appVersion: '1.2.3',
            uuid: 'test-uuid',
            session: 'test-session',
            'app-channel': 'mobile',
        });
    });

    it('clears the store after replaying, so the same batch is not replayed again next start', async () => {
        getRestLogFallbackStore().persist([
            { context: 'Incyclist', event: { message: 'crash in main window' } },
        ]);

        await initRestLogging();
        expect(getRestLogFallbackStore().size).toBe(0);

        // Simulate a second app start with a fresh adapter - nothing left to replay.
        mockAdapters.length = 0;
        await initRestLogging();

        const entries = mockAdapters[0].log.mock.calls;
        expect(entries.some(([, event]: any[]) => event.message === 'crash in main window')).toBe(false);
    });

    it('reports how many fallback events were recovered', async () => {
        getRestLogFallbackStore().persist([
            { context: 'Incyclist', event: { message: 'one' } },
            { context: 'Incyclist', event: { message: 'two' } },
        ]);

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'Logging initialiazed');
        expect(entry.event.replayedFallback).toBe(2);
    });
});
