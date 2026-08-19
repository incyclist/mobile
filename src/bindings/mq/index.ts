import mqtt from 'mqtt';
import type { MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';
import { getSecretBinding } from '../secret';
import { EventLogger } from 'gd-eventlog';
import { v4 } from 'uuid';
import { Platform } from 'react-native';
import { isProdVariant } from '../appInfo';
import { toWebsocketUri } from './utils';
import { getUserSettingsBinding } from '../user-settings';

const CONNECT_RETRY_INTERVAL = 10000;   // 10 seconds
const CONNECT_RETRY_CNT = 5;            // number of attempts before taking a pause
const CONNECT_TIMEOUT = 5000;           // 5 seconds

// MQTT.js expects every timing option in *milliseconds*, so CONNECT_TIMEOUT is passed
// straight through. The native module this class used to wrap expected `timeout` in
// seconds, and feeding it milliseconds made the real timeout ~83 minutes instead of ~5
// seconds - which hugely widened the window in which an abandoned connect attempt could
// still complete after the JS side had moved on to a retry (FIXES_BACKLOG item #15).
// That unit mismatch cannot recur here, but the per-attempt isolation it exposed is
// still deliberately preserved below.
const KEEPALIVE_SECONDS = 60;           // MQTT.js takes keepalive in seconds
const SUBSCRIBE_RETRY_INTERVAL = 10000; // 10 seconds - same cadence as the connect retries

// The broker address is not a secret: it is a public endpoint and the same one for every
// user, so keeping it in the secrets store bought nothing and made every environment
// change an ops step. It lives here instead, as this platform's default - mobile speaks
// MQTT over a TLS WebSocket, while desktop/web-ui keep their own transport and their own
// default - and can be pointed at a test or staging broker from settings.
//
// The credentials are still secrets, and still decide whether MQTT runs at all: clearing
// them server-side disables it for everyone without needing a release, which is the same
// kill switch removing the broker url used to provide.
const DEFAULT_BROKER_URL = 'wss://mq.api.incyclist.com/ws';
const BROKER_SETTING = 'mq.broker';

export class MessageQueue extends EventEmitter {
    private client?: MqttClient;
    private brokerUri!: string;
    private isConnected: boolean = false;
    private connectPromise!: Promise<boolean> | null;
    private logger: EventLogger;
    private queue: Array<{ topic: string; payload: string; ts: number }> = [];
    private subscriptions: Set<string> = new Set();
    private pending: Set<string> = new Set();
    private toConnect: NodeJS.Timeout|undefined
    private toSubscribeRetry: NodeJS.Timeout|undefined

    // The client instance created by the most recently started connect attempt.
    // Every retry gets its *own* fresh MqttClient (own socket, own listeners) so two
    // attempts can never collide, and this field is the JS-side identity check that makes
    // sure a late event from an abandoned/superseded attempt can never resurrect
    // connection state after a newer attempt has already resolved.
    private currentAttemptClient?: MqttClient

    static _instance: MessageQueue | null;

    static getInstance() {
        MessageQueue._instance = MessageQueue._instance ?? new MessageQueue();
        return MessageQueue._instance;
    }

    constructor() {
        super();
        this.logger = new EventLogger('mq');
        this.logger.logEvent({ message: 'create message queue' });
    }

    enabled(): boolean {
        return !!this.getSecret('MQ_USER') && !!this.getSecret('MQ_PASSWORD');
    }

    async subscribe(topic: string) {
        try {
            // Accepted now, established when the connection is up - the same contract
            // publish() has always had. `this.client` is only set once a connection has
            // succeeded, so before the first connect completes this is the normal path,
            // not an edge case: a subscribe at app startup lands here.
            if (!this.isConnected || !this.client) {
                this.pending.add(topic);
                this.logger.logEvent({ message: 'mq subscribe deferred', topic, reason: 'not connected' });

                // Start a connection if none is running. connect() de-duplicates concurrent
                // callers, so a subscribe during startup joins the attempt already in flight
                // rather than starting a second one, and subscribePending() picks the topic
                // up the moment it succeeds. Deliberately not awaited: a failing connect
                // takes CONNECT_RETRY_CNT * CONNECT_RETRY_INTERVAL to give up and the caller
                // must not be blocked for that long.
                this.connect().catch((err) => this.logError(err, 'subscribe'));
                return;
            }

            // Registered up front, on purpose: callers are told the subscription exists and
            // the binding then keeps trying until it really does. Doing this before the
            // call also means the retry path below does not depend on whether the client
            // happens to invoke its callback synchronously.
            this.subscriptions.add(topic);
            this.emit('mq-subscribed', topic);

            // The callback carries the broker's answer. Without it a subscribe that the
            // broker rejected - wrong vhost permissions being the usual cause - looks
            // exactly like one that succeeded, and the topic then stays silent forever
            // with nothing in the log to explain why.
            this.client.subscribe(topic, { qos: 0 }, (err, granted) => {
                if (err) {
                    this.logger.logEvent({ message: 'mq subscribe failed', topic, error: err.message });
                    this.retrySubscribe(topic);
                    return;
                }

                // Per MQTT 3.1.1 a granted QoS of 128 is a refusal, reported without an error.
                const qos = granted?.find((g) => g.topic === topic)?.qos ?? granted?.[0]?.qos;
                if (qos === undefined || qos === 128) {
                    this.logger.logEvent({ message: 'mq subscribe rejected', topic, qos });
                    this.retrySubscribe(topic);
                    return;
                }

                this.pending.delete(topic);
                this.logger.logEvent({ message: 'mq subscribed', topic, qos });
            });
        } catch (err) {
            this.logError(err, 'subscribe');
        }
    }

    unsubscribe(topic: string) {
        this.subscriptions.delete(topic);
        this.pending.delete(topic)

        try {
            if (!this.client || !this.isConnected) return;

            this.client.unsubscribe(topic, (err?: Error) => {
                if (err) {
                    this.logger.logEvent({ message: 'mq unsubscribe failed', topic, error: err.message });
                    return;
                }
                this.logger.logEvent({ message: 'mq unsubscribed', topic });
            });
        } catch (err) {
            this.logError(err, 'subscribe');
        }
    }

    publish(topic: string, payload: object) {
        try {
            let message: string | undefined;
            try {
                message = JSON.stringify(payload);
                if (!this.isConnected) {
                    this.queue.push({ topic, payload: message, ts: Date.now() });
                    return;
                }
                this.send(topic, message);
            } catch {
                if (message) {
                    this.queue.push({ topic, payload: message, ts: Date.now() });
                }
            }
        } catch (err) {
            this.logError(err, 'publish');
        }
    }

    private send(topic: string, message: string) {
        const data = Buffer.from(message, 'utf-8');
        this.client?.publish(topic, data, { qos: 0, retain: false });
    }

    async connect(): Promise<boolean> {
        if (this.connectPromise !== null && this.connectPromise !== undefined) {
            return await this.connectPromise;
        }

        if (this.isConnected) return true;

        this.logger.logEvent({ message: 'connecting to message queue ...', platform:Platform.OS, isProdVariant });

        const username = this.getSecret('MQ_USER');
        const password = this.getSecret('MQ_PASSWORD');

        if (!username || !password) {
            this.logger.logEvent({ message: 'mqtt disabled', reason: 'no credentials' });
            return false;
        }

        const broker = this.getBrokerUrl();

        // Still normalised rather than used verbatim, so an override written the way the
        // broker is usually referred to - mqtts://host - resolves to the WebSocket
        // endpoint instead of silently failing.
        const { uri, tls } = toWebsocketUri(broker);
        this.logger.logEvent({ message: 'mqtt broker uri resolved', broker, uri, tls });
        this.brokerUri = uri;

        this.connectPromise = new Promise<boolean>((done) => {
            const clientId = 'mobile' + v4();
            const options: IClientOptions = {
                username,
                password,
                clientId,
                connectTimeout: CONNECT_TIMEOUT,
                keepalive: KEEPALIVE_SECONDS,
                clean: true,
                // This class owns the retry loop below, so MQTT.js's own reconnection is
                // kept off for the duration of a connect attempt - two competing retry
                // loops would make the per-attempt isolation below meaningless. It is
                // switched on again in onConnected(), once an attempt has won, to give
                // the same auto-reconnect-after-a-real-disconnect behaviour the native
                // module provided via `autoReconnect: true`.
                reconnectPeriod: 0,
                // Subscriptions are re-established by subscribePending() on every
                // (re)connect, so MQTT.js must not also replay them itself.
                resubscribe: false,
            };

            this.connectRetries(options, CONNECT_RETRY_CNT, CONNECT_RETRY_INTERVAL)
                .then(done);
        });

        this.isConnected = await this.connectPromise;
        this.connectPromise = null;
        return this.isConnected;
    }

    disconnect(): void {
        if (!this.isConnected) return;

        // Drop the identity of the live attempt first: end() tears the connection down
        // asynchronously, and any event it emits on the way out must not be mistaken for
        // a spontaneous disconnect and trigger reconnect handling.
        this.currentAttemptClient = undefined;
        this.clearSubscribeRetry();

        try {
            this.client?.end();
        } catch (err: any) {
            this.logger.logEvent({ message: 'disconnect failed', reason: err.message });
        }
        this.isConnected = false;
        this.connectPromise = null;
        this.logger.logEvent({ message: 'mqtt disconnect requested by app' });
    }

    private async connectRetries(
        options: IClientOptions,
        max: number,
        delay: number,
    ): Promise<boolean> {
        let success = false;
        let failed = 0;

        const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

        while (!success) {
            success = await this.doConnect(options);
            if (!success) {
                ++failed;
                if (failed >= max) {
                    return success;
                }
                await sleep(delay);
            }
        }

        return success;
    }

    // Best-effort teardown of an abandoned/superseded connect attempt: detach our own
    // listeners (so the closures captured in doConnect() can be garbage collected) and
    // force the client to close. A no-op error handler is left attached because MQTT.js
    // emits 'error' on an EventEmitter - an error arriving after the last listener was
    // removed would otherwise be thrown as an unhandled 'error' event.
    private abandonClient(client: MqttClient, handlers: Array<[string, (...args: any[]) => void]>) {
        try {
            handlers.forEach(([event, handler]) => {
                client.removeListener(event as any, handler);
            });
            client.on('error', () => { /* swallow - this attempt is abandoned */ });
        } catch {
            // best effort - failing to detach listeners must never block the retry loop
        }
        try {
            client.end(true);
        } catch {
            // best effort - the attempt is already abandoned, nothing else we can do
        }
    }

    private doConnect(options: IClientOptions): Promise<boolean> {
        // Every attempt gets its own fresh MqttClient - its own WebSocket, its own
        // listeners, its own state machine. Nothing is shared between attempts, so a
        // slow attempt that the JS-side timeout has already given up on cannot interfere
        // with the attempt that replaced it. The identity check below is the second half
        // of that guarantee: it makes a late event from such an attempt a no-op even if
        // listener removal did not (or could not) take effect in time. The options are
        // copied for the same reason - onConnected() mutates client.options.reconnectPeriod,
        // which must not leak into a later attempt.
        const client = mqtt.connect(this.brokerUri, { ...options });
        this.currentAttemptClient = client;

        const isCurrentAttempt = () => this.currentAttemptClient === client;

        return new Promise<boolean>((resolve) => {
            let settled = false;

            // Only *our* listeners, recorded so exactly these can be detached again when
            // the attempt is abandoned. MQTT.js registers internal 'connect' and 'close'
            // handlers on the client itself, so removeAllListeners() would break its own
            // teardown path.
            const handlers: Array<[string, (...args: any[]) => void]> = [];
            const listen = (event: string, handler: (...args: any[]) => void) => {
                handlers.push([event, handler]);
                client.on(event as any, handler);
            };

            const clearConnectTimeout = () => {
                if (this.toConnect) {
                    clearTimeout(this.toConnect);
                    this.toConnect = undefined;
                }
            };

            // Resolves this attempt as failed exactly once, and only if this attempt is
            // still the current one - a stale/abandoned attempt can never affect state
            // or resolve a promise that a newer attempt has already settled.
            const settleFailure = (message: string, info?: string) => {
                if (!isCurrentAttempt() || settled) return;
                settled = true;
                clearConnectTimeout();
                this.logger.logEvent({ message, info });
                this.abandonClient(client, handlers);
                resolve(false);
            };

            const onConnected = () => {
                if (!isCurrentAttempt()) {
                    // Late success from an abandoned attempt - ignore entirely, a newer
                    // attempt has already resolved (or is in flight).
                    return;
                }

                if (settled) {
                    // MQTT.js re-established the connection on the client that won this
                    // attempt. Restore the state onDisconnected() tore down and replay
                    // everything that was parked while the connection was down - without
                    // this the class would stay `isConnected: false` forever after the
                    // first drop, silently queueing publishes against a live socket.
                    this.isConnected = true;
                    this.logger.logEvent({ message: 'mqtt reconnected', uri: this.brokerUri });
                    this.subscribePending();
                    this.flushQueue();
                    return;
                }

                settled = true;
                clearConnectTimeout();

                this.client = client;
                this.isConnected = true;

                // This attempt won, so hand reconnection back to MQTT.js: from here on a
                // real disconnect during normal operation is retried by the client itself.
                client.options.reconnectPeriod = CONNECT_RETRY_INTERVAL;

                // The uri is repeated here on purpose. It is already logged before the
                // attempt starts, but the log adapter is registered asynchronously during
                // app startup, so those earlier lines are routinely lost - this one lands
                // late enough to survive, and is often the only record of which endpoint
                // was actually used.
                this.logger.logEvent({ message: 'mqtt connected', uri: this.brokerUri });

                this.subscribePending();
                this.flushQueue();

                resolve(true);
            };

            const onDisconnected = () => {
                if (!isCurrentAttempt()) return;

                if (!settled) {
                    // Closed before ever connecting - this attempt failed.
                    settleFailure('mqtt connection disconnected');
                    return;
                }

                // Already connected once on this (still current/live) client - a real
                // disconnect during normal operation. Reconnection is handled by MQTT.js.
                this.isConnected = false;
                clearConnectTimeout();
                this.clearSubscribeRetry();
                this.prepareSubscriptionsForReconnect();
                this.logger.logEvent({ message: 'mqtt connection disconnected' });
            };

            const onError = (err: Error) => {
                if (!isCurrentAttempt()) return;

                if (!settled) {
                    settleFailure('mqtt error', err?.message);
                    return;
                }

                clearConnectTimeout();
                this.logger.logEvent({ message: 'mqtt error', info: err?.message });
            };

            const onMessage = (topic: string, message: Uint8Array) => this.onMessage(topic, message);

            listen('connect', onConnected);
            listen('close', onDisconnected);
            listen('message', onMessage);
            listen('error', onError);

            // JS-side fallback: MQTT.js applies connectTimeout itself, but a client that
            // never reports either way must not stall the retry loop forever.
            const onTimeout = () => settleFailure('mqtt timeout');
            this.toConnect = setTimeout(onTimeout, CONNECT_TIMEOUT + 2000)

            this.logger.logEvent({ message: 'trying to connect to mqtt' });
        });
    }

    private flushQueue() {
        if (!this.queue) return;

        const queued = this.queue.length;
        if (queued > 0) {
            this.logger.logEvent({ message: 'mq flushing queued messages', count: queued });
        }

        let done = false;
        while (this.queue.length && !done) {
            const element = this.queue.pop();
            if (!element) {
                done = true;
            } else {
                if (Date.now() - element.ts > 3600 * 1000) continue;
                this.send(element.topic, element.payload);
            }
        }
    }

    // A subscription the broker would not grant is retried indefinitely, and deliberately
    // so: the usual cause is a permission or broker-state problem that resolves itself,
    // and callers were already told the subscription exists. The loop ends only when the
    // subscription is established, unsubscribe() is called for the topic, or the
    // connection goes away - a reconnect replays everything through subscribePending()
    // anyway, so the timer would only duplicate that work.
    private retrySubscribe(topic: string) {
        // unsubscribe() removes the topic from both sets; if it is gone from subscriptions
        // the caller no longer wants it and this attempt must not resurrect it.
        if (!this.subscriptions.has(topic)) return;

        this.pending.add(topic);

        if (this.toSubscribeRetry) return;

        this.toSubscribeRetry = setTimeout(() => {
            this.toSubscribeRetry = undefined;
            if (!this.isConnected || this.pending.size === 0) return;
            this.subscribePending();
        }, SUBSCRIBE_RETRY_INTERVAL);
    }

    private clearSubscribeRetry() {
        if (this.toSubscribeRetry) {
            clearTimeout(this.toSubscribeRetry);
            this.toSubscribeRetry = undefined;
        }
    }

    private prepareSubscriptionsForReconnect() {
        if (this.subscriptions.size > 0) {
            this.subscriptions.forEach( topic=> {
                this.pending.add(topic)
            })
            this.subscriptions.clear()
        }

    }

    private subscribePending() {
        const topics = Array.from(this.pending.values());
        this.pending.clear()

        topics.forEach( topic=> {
            this.subscribe(topic)
        })
    }

    private onMessage(topic: string, message: Uint8Array) {
        try {
            this.emit('mq-message', topic, message);
        } catch (err: any) {
            this.logger.logEvent({ message: 'error', fn: 'onMessage', error: err.message });
        }
    }

    protected logError(err: any, fn: string) {
        this.logger.logEvent({ message: 'error', fn, error: err.message, stack: err.stack });
    }

    // Settings override first, this platform's default otherwise.
    protected getBrokerUrl(): string {
        return getUserSettingsBinding().getValue(BROKER_SETTING, undefined) ?? DEFAULT_BROKER_URL;
    }

    protected getSecret(key: string) {
        return getSecretBinding().getSecret(key);
    }
}

export const getMessageQueueBinding = () => MessageQueue.getInstance();
