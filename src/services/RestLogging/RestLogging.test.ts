// Covers the handover of early startup events to the REST adapter. The REST adapter cannot
// be registered until the settings have loaded, so anything logged before that - which is
// most of app startup - used to reach the console and nothing else.

const mockSettings: Record<string, any> = {};
const mockAdapters: any[] = [];

jest.mock('../IncyclistApi', () => ({
    ApiConfiguration: { getInstance: () => ({ addHeader: jest.fn() }) },
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('../../bindings/appInfo', () => ({
    getAppInfoBinding: async () => ({
        getAppVersion: () => '1.2.3',
        getUIVersion: () => '0.1.1',
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

describe('initRestLogging - early event handover', () => {

    beforeEach(() => {
        EventLogger.reset();
        resetLogBacklog();
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

    it('tags replayed events, and gives them the globals every other line carries', async () => {
        startupLogging();
        new EventLogger('mq').logEvent({ message: 'mqtt connected' });

        await initRestLogging();

        const entry = replayed().find((e: any) => e.event.message === 'mqtt connected');
        expect(entry.event).toMatchObject({
            replayed: true,
            version: '0.1.1',
            appVersion: '1.2.3',
            uuid: 'test-uuid',
        });
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
