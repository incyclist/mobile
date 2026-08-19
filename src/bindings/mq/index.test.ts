// Behaviour tests for the MQTT.js (WebSocket) message queue binding.
//
// The retry/abandon logic these cover originally guarded a native MQTT module: a reused
// native client across connect retries could let an abandoned attempt's delayed native
// completion double-invoke a React Native single-shot Callback, tripping a native fatal
// abort (FIXES_BACKLOG item #15). The native module is gone, but the invariant it forced
// - an abandoned attempt can never affect state a newer attempt has already settled -
// still has to hold, and MQTT.js's client model does not provide it for free. See
// src/bindings/mq/index.ts.

const mockSecrets: Record<string, string | undefined> = {};
const mockSettings: Record<string, any> = {};
const mockPlatform = { OS: 'android' };
const mockAppInfo = { isProdVariant: false };

jest.mock('mqtt', () => {
    const { EventEmitter: NodeEventEmitter } = require('events');

    const instances: any[] = [];

    class FakeClient extends NodeEventEmitter {
        url: string;
        options: any;
        subscribe: jest.Mock;
        unsubscribe: jest.Mock;
        publish: jest.Mock;
        end: jest.Mock;
        removeListener: any;

        constructor(url: string, options: any) {
            super();
            this.url = url;
            this.options = options;
            this.subscribe = jest.fn();
            this.unsubscribe = jest.fn();
            this.publish = jest.fn();
            this.end = jest.fn();
            // Spy only - deliberately does NOT detach the underlying listener the way the
            // real EventEmitter would. This lets the tests below prove that it is the
            // class's own isCurrentAttempt() guard - not listener removal - that keeps a
            // late event from an abandoned attempt from mutating connection state.
            this.removeListener = jest.fn();
            instances.push(this);
        }
    }

    return {
        __esModule: true,
        default: {
            connect: (url: string, options: any) => new FakeClient(url, options),
        },
        __instances: instances,
    };
});

// The factory runs while `mockPlatform` is still being initialised (jest hoists
// jest.mock above the const declarations), so the value has to be read lazily.
jest.mock('react-native', () => ({
    get Platform() { return mockPlatform; },
}));
jest.mock('../appInfo', () => ({
    get isProdVariant() { return mockAppInfo.isProdVariant; },
}));
jest.mock('../secret', () => ({
    getSecretBinding: () => ({
        getSecret: (key: string) => mockSecrets[key],
    }),
}));
jest.mock('../user-settings', () => ({
    getUserSettingsBinding: () => ({
        getValue: (key: string, defValue: any) => mockSettings[key] ?? defValue,
    }),
}));

import { MessageQueue } from './index';

const mockInstances = (jest.requireMock('mqtt') as { __instances: any[] }).__instances;

const CONNECT_TIMEOUT = 5000;
const CONNECT_RETRY_INTERVAL = 10000;

// Simulates a successful connection on a given mocked client - MQTT.js signals this with
// a 'connect' event.
const succeed = (client: any) => client.emit('connect');

describe('MessageQueue', () => {
    let mq: MessageQueue;

    beforeEach(() => {
        jest.useFakeTimers();
        mockInstances.length = 0;
        Object.keys(mockSecrets).forEach((key) => delete mockSecrets[key]);
        Object.keys(mockSettings).forEach((key) => delete mockSettings[key]);
        mockSecrets.MQ_USER = 'user';
        mockSecrets.MQ_PASSWORD = 'pass';
        mockPlatform.OS = 'android';
        mockAppInfo.isProdVariant = false;
        MessageQueue._instance = null;
        mq = MessageQueue.getInstance();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('broker address', () => {
        // The broker is a public endpoint, not a secret. It has a built-in default and is
        // only overridden for a test or staging broker.
        test('uses the built-in default when nothing overrides it', async () => {
            const promise = mq.connect();

            expect(mockInstances[0].url).toBe('wss://mq.api.incyclist.com:443/ws');

            succeed(mockInstances[0]);
            await promise;
        });

        test('a settings override wins over the default', async () => {
            mockSettings['mq.broker'] = 'wss://staging.example.com:15675/mqtt';

            const promise = mq.connect();

            expect(mockInstances[0].url).toBe('wss://staging.example.com:15675/mqtt');

            succeed(mockInstances[0]);
            await promise;
        });

        test('an override written as mqtts:// is normalised, not used verbatim', async () => {
            mockSettings['mq.broker'] = 'mqtts://staging.example.com';

            const promise = mq.connect();

            expect(mockInstances[0].url).toBe('wss://staging.example.com:443/ws');

            succeed(mockInstances[0]);
            await promise;
        });

        test('the broker is no longer read from the secrets store', async () => {
            mockSecrets.MQ_BROKER = 'mqtts://should-be-ignored.example.com';

            const promise = mq.connect();

            expect(mockInstances[0].url).toBe('wss://mq.api.incyclist.com:443/ws');

            succeed(mockInstances[0]);
            await promise;
        });

        test('credentials decide whether mqtt runs at all', async () => {
            delete mockSecrets.MQ_PASSWORD;

            expect(mq.enabled()).toBe(false);
            expect(await mq.connect()).toBe(false);
            expect(mockInstances).toHaveLength(0);
        });

        test('is enabled when both credentials are present', () => {
            expect(mq.enabled()).toBe(true);
        });
    });

    describe('connect options', () => {
        test('passes the connect timeout to MQTT.js in milliseconds', async () => {
            const promise = mq.connect();

            expect(mockInstances).toHaveLength(1);
            expect(mockInstances[0].options.connectTimeout).toBe(CONNECT_TIMEOUT);
            expect(mockInstances[0].options.connectTimeout).toBe(5000);

            succeed(mockInstances[0]);
            await promise;
        });

        test('disables MQTT.js’s own reconnection while this class owns the retry loop', async () => {
            const promise = mq.connect();

            expect(mockInstances[0].options.reconnectPeriod).toBe(0);

            succeed(mockInstances[0]);
            await promise;
        });

        test('hands reconnection back to MQTT.js once an attempt has won', async () => {
            const promise = mq.connect();

            succeed(mockInstances[0]);
            await promise;

            expect(mockInstances[0].options.reconnectPeriod).toBe(CONNECT_RETRY_INTERVAL);
        });

        test('does not let a won attempt’s reconnect setting leak into a later attempt', async () => {
            const first = mq.connect();
            succeed(mockInstances[0]);
            await first;

            mq.disconnect();

            const second = mq.connect();
            expect(mockInstances).toHaveLength(2);
            expect(mockInstances[1].options.reconnectPeriod).toBe(0);

            succeed(mockInstances[1]);
            await second;
        });

        test('connects on iOS in a production build', async () => {
            mockPlatform.OS = 'ios';
            mockAppInfo.isProdVariant = true;

            const promise = mq.connect();

            expect(mockInstances).toHaveLength(1);

            succeed(mockInstances[0]);
            expect(await promise).toBe(true);
        });
    });

    describe('connect retry / client lifecycle', () => {
        test('a slow/timed-out first attempt is abandoned and retried on a fresh client', async () => {
            const promise = mq.connect();
            expect(mockInstances).toHaveLength(1);
            const client1 = mockInstances[0];

            // First attempt never completes client-side (no 'connect', 'close' or 'error')
            // -> the JS-side fallback timeout must fire.
            await jest.advanceTimersByTimeAsync(7000);

            // Abandoned attempt: forced close, and its listeners detached.
            expect(client1.end).toHaveBeenCalledWith(true);
            const detached = client1.removeListener.mock.calls.map((c: any[]) => c[0]);
            expect(detached).toEqual(expect.arrayContaining(['connect', 'close', 'message', 'error']));

            // Retry delay elapses.
            await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);

            expect(mockInstances).toHaveLength(2);
            const client2 = mockInstances[1];
            expect(client2).not.toBe(client1);

            succeed(client2);

            expect(await promise).toBe(true);
        });

        test('a connection that closes before connecting fails the attempt', async () => {
            const promise = mq.connect();
            const client1 = mockInstances[0];

            client1.emit('close');
            expect(client1.end).toHaveBeenCalledWith(true);

            await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);

            expect(mockInstances).toHaveLength(2);
            succeed(mockInstances[1]);
            expect(await promise).toBe(true);
        });

        test('an error before connecting fails the attempt', async () => {
            const promise = mq.connect();
            const client1 = mockInstances[0];

            client1.emit('error', new Error('handshake failed'));
            expect(client1.end).toHaveBeenCalledWith(true);

            await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);

            expect(mockInstances).toHaveLength(2);
            succeed(mockInstances[1]);
            expect(await promise).toBe(true);
        });

        test('gives up after the configured number of attempts', async () => {
            const promise = mq.connect();

            // 5 attempts, each timing out after ~7s, separated by a 10s retry delay.
            for (let i = 0; i < 5; i++) {
                await jest.advanceTimersByTimeAsync(7000);
                await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);
            }

            expect(await promise).toBe(false);
            expect(mockInstances).toHaveLength(5);
        });

        test('a late event from an abandoned attempt cannot resurrect state after a newer attempt has resolved', async () => {
            const promise = mq.connect();
            const client1 = mockInstances[0];

            await jest.advanceTimersByTimeAsync(7000);                     // attempt 1 abandoned
            await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);   // retry delay

            const client2 = mockInstances[1];
            succeed(client2);
            expect(await promise).toBe(true);

            // Attempt 1's handlers are (per this mock) still technically attached -
            // simulating an event that slipped through despite best-effort cleanup.
            // The class's own guard must ignore it regardless.
            expect(() => client1.emit('connect')).not.toThrow();
            expect(() => client1.emit('close')).not.toThrow();

            // Still routes through the live (attempt 2) client, not the abandoned one.
            mq.publish('topic/x', { a: 1 });
            expect(client2.publish).toHaveBeenCalled();
            expect(client1.publish).not.toHaveBeenCalled();
        });

        test('a stale attempt’s late error is harmless and does not re-open the connection', async () => {
            const promise = mq.connect();
            const client1 = mockInstances[0];

            await jest.advanceTimersByTimeAsync(7000);
            await jest.advanceTimersByTimeAsync(CONNECT_RETRY_INTERVAL);

            const client2 = mockInstances[1];
            succeed(client2);
            await promise;

            expect(() => client1.emit('error', new Error('very late failure'))).not.toThrow();

            // The already-connected state is unaffected, and a further connect() call
            // short-circuits without spinning up yet another client.
            expect(await mq.connect()).toBe(true);
            expect(mockInstances).toHaveLength(2);
        });

        test('an immediate successful connect only ever creates a single client', async () => {
            const promise = mq.connect();
            expect(mockInstances).toHaveLength(1);

            succeed(mockInstances[0]);

            expect(await promise).toBe(true);
            expect(mockInstances).toHaveLength(1);
        });

        test('concurrent connect() calls share a single attempt', async () => {
            const first = mq.connect();
            const second = mq.connect();

            expect(mockInstances).toHaveLength(1);

            succeed(mockInstances[0]);

            expect(await first).toBe(true);
            expect(await second).toBe(true);
        });
    });

    describe('publish / subscribe', () => {
        test('queues messages published before the connection is up and flushes them on connect', async () => {
            mq.publish('topic/queued', { a: 1 });

            const promise = mq.connect();
            const client = mockInstances[0];
            expect(client.publish).not.toHaveBeenCalled();

            succeed(client);
            await promise;

            expect(client.publish).toHaveBeenCalledTimes(1);
            const [topic, payload] = client.publish.mock.calls[0];
            expect(topic).toBe('topic/queued');
            expect(payload.toString()).toBe(JSON.stringify({ a: 1 }));
        });

        test('subscribes with qos 0 and re-subscribes after a reconnect', async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;

            await mq.subscribe('topic/a');
            expect(client.subscribe).toHaveBeenCalledWith('topic/a', { qos: 0 }, expect.any(Function));

            // A real disconnect on the live client: the subscription must be re-armed and
            // replayed once the client reports itself connected again.
            client.subscribe.mockClear();
            client.emit('close');
            succeed(client);
            await Promise.resolve();

            expect(client.subscribe).toHaveBeenCalledWith('topic/a', { qos: 0 }, expect.any(Function));
        });

        test('unsubscribe stops the topic being replayed after a reconnect', async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;

            await mq.subscribe('topic/a');
            mq.unsubscribe('topic/a');
            expect(client.unsubscribe).toHaveBeenCalledWith('topic/a', expect.any(Function));

            client.subscribe.mockClear();
            client.emit('close');
            succeed(client);
            await Promise.resolve();

            expect(client.subscribe).not.toHaveBeenCalled();
        });

        test('forwards incoming messages as mq-message events', async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;

            const received: Array<[string, Uint8Array]> = [];
            mq.on('mq-message', (topic: string, payload: Uint8Array) => received.push([topic, payload]));

            const payload = Buffer.from('hello', 'utf-8');
            client.emit('message', 'topic/in', payload);

            expect(received).toHaveLength(1);
            expect(received[0][0]).toBe('topic/in');
            expect(received[0][1].toString()).toBe('hello');
        });
    });

    describe('subscribe before the connection is up', () => {
        // Reproduces a real startup trace: a subscribe issued ~200ms before the connection
        // completed was silently discarded, because `this.client` is only assigned once a
        // connection has succeeded and subscribe() used to bail out on that. The topic was
        // never subscribed and nothing was logged.
        test('a subscribe issued while connecting is honoured once connected', async () => {
            const connecting = mq.connect();
            const client = mockInstances[0];

            await mq.subscribe('incyclist/features/uuid/+');
            expect(client.subscribe).not.toHaveBeenCalled();   // nothing to subscribe on yet

            succeed(client);
            await connecting;
            await Promise.resolve();

            expect(client.subscribe).toHaveBeenCalledWith(
                'incyclist/features/uuid/+', { qos: 0 }, expect.any(Function));
        });

        test('does not block the caller while a connect is failing', async () => {
            // No credentials: connect() resolves false immediately, but the point is that
            // subscribe() resolves at all without the test having to advance timers.
            delete mockSecrets.MQ_PASSWORD;

            await mq.subscribe('topic/a');

            expect((mq as any).pending.has('topic/a')).toBe(true);
        });

        test('a subscribe with no connection at all is replayed on the next connect', async () => {
            await mq.subscribe('topic/parked');

            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;
            await Promise.resolve();

            expect(client.subscribe).toHaveBeenCalledWith('topic/parked', { qos: 0 }, expect.any(Function));
        });
    });

    describe('subscribe retry', () => {
        // A subscription the broker refuses is retried indefinitely. Callers were already
        // told the subscription exists, so giving up silently would leave a topic dead
        // with no way for the caller to find out.
        const connectAndReject = async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;
            client.subscribe.mockImplementation((topic: string, _o: any, cb: any) =>
                cb(null, [{ topic, qos: 128 }]));
            await mq.subscribe('topic/denied');
            client.subscribe.mockClear();
            return client;
        };

        test('retries a rejected subscribe until the broker grants it', async () => {
            const client = await connectAndReject();

            await jest.advanceTimersByTimeAsync(10000);
            expect(client.subscribe).toHaveBeenCalledWith('topic/denied', { qos: 0 }, expect.any(Function));

            await jest.advanceTimersByTimeAsync(10000);
            expect(client.subscribe).toHaveBeenCalledTimes(2);

            // Broker starts granting it - the loop must then stop.
            client.subscribe.mockImplementation((topic: string, _o: any, cb: any) =>
                cb(null, [{ topic, qos: 0 }]));
            await jest.advanceTimersByTimeAsync(10000);
            expect(client.subscribe).toHaveBeenCalledTimes(3);

            client.subscribe.mockClear();
            await jest.advanceTimersByTimeAsync(60000);
            expect(client.subscribe).not.toHaveBeenCalled();
        });

        test('stops retrying once the topic is unsubscribed', async () => {
            const client = await connectAndReject();

            mq.unsubscribe('topic/denied');

            await jest.advanceTimersByTimeAsync(60000);
            expect(client.subscribe).not.toHaveBeenCalled();
        });

        test('stops retrying when the connection goes away', async () => {
            const client = await connectAndReject();

            client.emit('close');

            await jest.advanceTimersByTimeAsync(60000);
            expect(client.subscribe).not.toHaveBeenCalled();
        });

        test('stops retrying when the app disconnects', async () => {
            const client = await connectAndReject();

            mq.disconnect();

            await jest.advanceTimersByTimeAsync(60000);
            expect(client.subscribe).not.toHaveBeenCalled();
        });

        test('a reconnect replays the topic, so the retry loop does not duplicate it', async () => {
            const client = await connectAndReject();
            client.subscribe.mockImplementation((topic: string, _o: any, cb: any) =>
                cb(null, [{ topic, qos: 0 }]));

            client.emit('close');
            succeed(client);
            await Promise.resolve();

            expect(client.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('diagnostic logging', () => {
        // Previously a subscribe logged nothing at all, so a topic the broker had refused
        // looked identical to one that was working but simply had no traffic.
        const logged = () => (mq as any).logger.logEvent.mock.calls.map((c: any[]) => c[0]);

        const connected = async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;
            (mq as any).logger.logEvent = jest.fn();
            return client;
        };

        test('logs the granted qos when the broker accepts a subscribe', async () => {
            const client = await connected();
            client.subscribe.mockImplementation((topic: string, _o: any, cb: any) =>
                cb(null, [{ topic, qos: 0 }]));

            await mq.subscribe('topic/a');

            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq subscribed', topic: 'topic/a', qos: 0 }));
        });

        test('logs a rejection when the broker answers with qos 128', async () => {
            const client = await connected();
            client.subscribe.mockImplementation((topic: string, _o: any, cb: any) =>
                cb(null, [{ topic, qos: 128 }]));

            await mq.subscribe('topic/denied');

            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq subscribe rejected', topic: 'topic/denied', qos: 128 }));
        });

        test('logs a failed subscribe with the error', async () => {
            const client = await connected();
            client.subscribe.mockImplementation((_t: string, _o: any, cb: any) =>
                cb(new Error('not authorized')));

            await mq.subscribe('topic/a');

            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq subscribe failed', error: 'not authorized' }));
        });

        test('logs unsubscribe, and its failure', async () => {
            const client = await connected();
            client.unsubscribe.mockImplementation((_t: string, cb: any) => cb());

            mq.unsubscribe('topic/a');
            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq unsubscribed', topic: 'topic/a' }));

            client.unsubscribe.mockImplementation((_t: string, cb: any) => cb(new Error('boom')));
            (mq as any).subscriptions.add('topic/b');
            mq.unsubscribe('topic/b');
            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq unsubscribe failed', error: 'boom' }));
        });

        test('logs when a subscribe is deferred because there is no connection', async () => {
            // No credentials, so the connect() that subscribe() triggers bails out
            // immediately rather than running the full retry loop.
            delete mockSecrets.MQ_PASSWORD;
            (mq as any).client = {};   // non-null, so subscribe() does not bail out early
            (mq as any).logger.logEvent = jest.fn();

            await mq.subscribe('topic/later');

            expect(logged()).toContainEqual(
                expect.objectContaining({ message: 'mq subscribe deferred', topic: 'topic/later' }));
        });

        test('records the resolved endpoint on the connect event', async () => {
            // Replaced before connecting: the log adapter is registered asynchronously at
            // app startup, so the pre-connect lines are routinely lost and this is often
            // the only record of which endpoint was used.
            (mq as any).logger.logEvent = jest.fn();

            const promise = mq.connect();
            succeed(mockInstances[0]);
            await promise;

            expect(logged()).toContainEqual(
                expect.objectContaining({
                    message: 'mqtt connected', uri: 'wss://mq.api.incyclist.com:443/ws',
                }));
        });

        test('does not log individual incoming messages', async () => {
            const client = await connected();

            for (let i = 0; i < 20; i++) {
                client.emit('message', 'ride/updates', Buffer.from('x'));
            }

            expect(logged()).toEqual([]);
        });
    });

    describe('disconnect', () => {
        test('ends the client and ignores its subsequent events', async () => {
            const promise = mq.connect();
            const client = mockInstances[0];
            succeed(client);
            await promise;

            mq.disconnect();
            expect(client.end).toHaveBeenCalled();

            // A 'close' arriving as part of the teardown must not be treated as a
            // spontaneous disconnect that needs subscriptions re-armed.
            expect(() => client.emit('close')).not.toThrow();

            // A publish while disconnected is queued rather than sent.
            client.publish.mockClear();
            mq.publish('topic/x', { a: 1 });
            expect(client.publish).not.toHaveBeenCalled();
        });

        test('is a no-op when never connected', () => {
            expect(() => mq.disconnect()).not.toThrow();
            expect(mockInstances).toHaveLength(0);
        });
    });
});
