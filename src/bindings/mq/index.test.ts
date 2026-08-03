// Regression tests for FIXES_BACKLOG item #15: a reused native Mqtt.Client across
// connect retries could let an abandoned attempt's delayed native completion double-invoke
// a React Native single-shot Callback, tripping a native fatal abort. See src/bindings/mq/index.ts.

jest.mock('@fdfedin/react-native-native-mqtt', () => {
    const { EventEmitter: NodeEventEmitter } = require('events');

    const Event = {
        Connect: 'connect',
        Disconnect: 'disconnect',
        Message: 'message',
        Error: 'error',
    };

    const instances: any[] = [];

    class Client extends NodeEventEmitter {
        url: string;
        connect: jest.Mock;
        subscribe: jest.Mock;
        unsubscribe: jest.Mock;
        publish: jest.Mock;
        disconnect: jest.Mock;
        close: jest.Mock;
        off: jest.Mock;

        constructor(url: string) {
            super();
            this.url = url;
            this.connect = jest.fn();
            this.subscribe = jest.fn();
            this.unsubscribe = jest.fn();
            this.publish = jest.fn();
            this.disconnect = jest.fn();
            this.close = jest.fn();
            // Spy only - deliberately does NOT detach the underlying listener the way the
            // real library's off() would. This lets the tests below prove that it is the
            // class's own isCurrentAttempt() guard - not listener removal - that keeps a
            // late event from an abandoned attempt from mutating connection state.
            this.off = jest.fn();
            instances.push(this);
        }
    }

    return { Client, Event, __instances: instances };
});

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../appInfo', () => ({ isProdVariant: false }));
jest.mock('../secret', () => ({
    getSecretBinding: () => ({
        getSecret: (key: string) => {
            switch (key) {
                case 'MQ_BROKER': return 'mqtt://broker.example.com:1883';
                case 'MQ_USER': return 'user';
                case 'MQ_PASSWORD': return 'pass';
                default: return undefined;
            }
        },
    }),
}));

import * as Mqtt from '@fdfedin/react-native-native-mqtt';
import { MessageQueue, CONNECT_TIMEOUT_SECONDS } from './index';

const mockInstances = (Mqtt as unknown as { __instances: any[] }).__instances;

// Simulates a successful native connection on a given mocked client: the connect()
// call's own callback fires without error, and (separately, as the real library does)
// the broker-level 'connect' event is broadcast.
const succeed = (client: any) => {
    const callback = client.connect.mock.calls[0][1];
    callback();
    client.emit(Mqtt.Event.Connect, false);
};

describe('MessageQueue - connect retry / native client lifecycle', () => {
    let mq: MessageQueue;

    beforeEach(() => {
        jest.useFakeTimers();
        mockInstances.length = 0;
        MessageQueue._instance = null;
        mq = MessageQueue.getInstance();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('sends the connect timeout to native in seconds, not milliseconds', async () => {
        const promise = mq.connect();

        expect(mockInstances).toHaveLength(1);
        const options = mockInstances[0].connect.mock.calls[0][0];

        expect(options.timeout).toBe(CONNECT_TIMEOUT_SECONDS);
        expect(options.timeout).toBe(5);
        expect(options.timeout).not.toBe(5000);

        succeed(mockInstances[0]);
        await promise;
    });

    test('a slow/timed-out first attempt is abandoned and retried on a fresh client instance', async () => {
        const promise = mq.connect();
        expect(mockInstances).toHaveLength(1);
        const client1 = mockInstances[0];

        // First attempt never completes client-side (neither its connect() callback nor a
        // connect/disconnect event fires) -> the JS-side fallback timeout must fire.
        await jest.advanceTimersByTimeAsync(7000);

        // Abandoned attempt: best-effort disconnect, and its listeners detached.
        expect(client1.disconnect).toHaveBeenCalledTimes(1);
        expect(client1.off).toHaveBeenCalledWith(Mqtt.Event.Connect);
        expect(client1.off).toHaveBeenCalledWith(Mqtt.Event.Disconnect);
        expect(client1.off).toHaveBeenCalledWith(Mqtt.Event.Message);
        expect(client1.off).toHaveBeenCalledWith(Mqtt.Event.Error);

        // Retry delay elapses.
        await jest.advanceTimersByTimeAsync(10000);

        expect(mockInstances).toHaveLength(2);
        const client2 = mockInstances[1];
        expect(client2).not.toBe(client1);

        succeed(client2);

        const connected = await promise;
        expect(connected).toBe(true);
    });

    test('a late event from an abandoned attempt cannot resurrect state after a newer attempt has resolved', async () => {
        const promise = mq.connect();
        const client1 = mockInstances[0];

        await jest.advanceTimersByTimeAsync(7000);  // attempt 1 abandoned
        await jest.advanceTimersByTimeAsync(10000); // retry delay

        const client2 = mockInstances[1];
        succeed(client2);
        const connected = await promise;
        expect(connected).toBe(true);

        // Attempt 1's connect handler is (per this mock) still technically attached -
        // simulating a native message that slipped through despite best-effort cleanup.
        // The class's own guard must ignore it regardless of whether off() succeeded.
        expect(() => client1.emit(Mqtt.Event.Connect, false)).not.toThrow();

        // Still routes through the live (attempt 2) client, not the abandoned one.
        mq.publish('topic/x', { a: 1 });
        expect(client2.publish).toHaveBeenCalled();
        expect(client1.publish).not.toHaveBeenCalled();
    });

    test('no cross-instance callback interference: a stale attempt`s late callback is harmless', async () => {
        const promise = mq.connect();
        const client1 = mockInstances[0];

        await jest.advanceTimersByTimeAsync(7000);
        await jest.advanceTimersByTimeAsync(10000);

        const client2 = mockInstances[1];
        succeed(client2);
        await promise;

        // This is the real production crash trigger: an abandoned attempt's native
        // connect() completing very late and invoking its own (distinct, per-attempt)
        // callback. Because attempt 1 now owns its own Mqtt.Client/callback, this must
        // be fully independent of attempt 2 - no throw, no double-resolution artefacts.
        const staleCallback = client1.connect.mock.calls[0][1];
        expect(() => staleCallback()).not.toThrow();

        // The already-connected state is unaffected, and a further connect() call
        // short-circuits without spinning up yet another client.
        const again = await mq.connect();
        expect(again).toBe(true);
        expect(mockInstances).toHaveLength(2);
    });

    test('an immediate successful connect only ever creates a single client', async () => {
        const promise = mq.connect();
        expect(mockInstances).toHaveLength(1);

        succeed(mockInstances[0]);

        const connected = await promise;
        expect(connected).toBe(true);
        expect(mockInstances).toHaveLength(1);
    });
});
