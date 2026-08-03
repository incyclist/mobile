import * as Mqtt from '@fdfedin/react-native-native-mqtt';
import { EventEmitter } from 'events';
import { getSecretBinding } from '../secret';
import { EventLogger } from 'gd-eventlog';
import { v4 } from 'uuid';
import { Platform } from 'react-native';
import { isProdVariant } from '../appInfo';
import { normaliseMqttUri } from './utils';

const CONNECT_RETRY_INTERVAL = 10000;   // 10 seconds
const CONNECT_RETRY_CNT = 5;            // number of attempts before taking a pause
const CONNECT_TIMEOUT = 5000;           // 5 seconds - JS-side fallback timeout, in ms

// The native module (Paho under the hood) expects `timeout` in *seconds*, not milliseconds.
// Sending CONNECT_TIMEOUT (ms) straight through used to make the real native timeout
// ~83 minutes instead of ~5 seconds, which hugely widened the window in which an
// abandoned connect attempt could still complete after the JS side had already moved on
// to a retry - see FIXES_BACKLOG item #15.
export const CONNECT_TIMEOUT_SECONDS = CONNECT_TIMEOUT / 1000; // 5 seconds

export class MessageQueue extends EventEmitter {
    private client?: Mqtt.Client;
    private nativeUri!: string;
    private isConnected: boolean = false;
    private connectPromise!: Promise<boolean> | null;
    private logger: EventLogger;
    private queue: Array<{ topic: string; payload: string; ts: number }> = [];
    private subscriptions: Set<string> = new Set();
    private pending: Set<string> = new Set();
    private toConnect: NodeJS.Timeout|undefined

    // The client instance created by the most recently started connect attempt.
    // Every retry gets its *own* fresh `Mqtt.Client` (own native id, own native callback
    // reference) so two attempts can never collide on the native side. This field is
    // additionally used JS-side to make sure a late event from an abandoned/superseded
    // attempt can never resurrect connection state after a newer attempt has resolved.
    private currentAttemptClient?: Mqtt.Client

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
        return !!this.getSecret('MQ_BROKER');
    }

    async subscribe(topic: string) {
        try {
            if (!this.client) return;
            if (!this.isConnected) {
                const connected = await this.connect()
                if (!connected) {
                    this.pending.add(topic)
                    return
                }
            }

            this.client.subscribe([topic], [0]);
            this.emit('mq-subscribed', topic);
            this.subscriptions.add(topic);
        } catch (err) {
            this.logError(err, 'subscribe');
        }
    }

    unsubscribe(topic: string) {
        this.subscriptions.delete(topic);
        this.pending.delete(topic)

        try {
            if (!this.client || !this.isConnected) return;

            this.client.unsubscribe([topic]);
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
        this.client?.publish(topic, data, 0, false);
    }

    async connect(): Promise<boolean> {
        if (this.connectPromise !== null && this.connectPromise !== undefined) {
            return await this.connectPromise;
        }

        if (this.isConnected) return true;


        this.logger.logEvent({ message: 'connecting to message queue ...', platform:Platform.OS, isProdVariant });

        // Temporarily disabled MQTT on iOS in production
        if (Platform.OS === 'ios' && isProdVariant) {
            return false;
        }

        const uri = this.getSecret('MQ_BROKER');

        if (!this.enabled()) {
            this.logger.logEvent({ message: 'mqtt disabled', reason: 'no broker specified' });
            return false;
        }

        const username = this.getSecret('MQ_USER');
        const password = this.getSecret('MQ_PASSWORD');

        if (!uri || !username || !password) return false;

        const { nativeUri, tls } = normaliseMqttUri(uri, Platform.OS as 'ios' | 'android');
        this.logger.logEvent({ message: 'mqtt broker uri normalised', uri, nativeUri, tls });
        this.nativeUri = nativeUri;

        this.connectPromise = new Promise<boolean>((done) => {
            const clientId = 'mobile' + v4();
            const options: Mqtt.ConnectionOptions = {
                username,
                password,
                clientId,
                timeout: CONNECT_TIMEOUT_SECONDS,
                keepAlive: 60,
                autoReconnect: true,
                ...(tls ? { enableSsl: true, allowUntrustedCA:true } : {}),
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

        try {
            this.client?.disconnect();
        } catch (err: any) {
            this.logger.logEvent({ message: 'disconnect failed', reason: err.message });
        }
        this.isConnected = false;
        this.connectPromise = null;
        this.logger.logEvent({ message: 'mqtt disconnect requested by app' });
    }

    private async connectRetries(
        options: Mqtt.ConnectionOptions,
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
    // ask the native side to disconnect. This does not (and cannot, without patching the
    // native library) remove the NativeEventEmitter subscriptions the client constructor
    // registers - that part of the leak is native-library behaviour outside this repo.
    private abandonClient(client: Mqtt.Client) {
        try {
            client.off(Mqtt.Event.Connect);
            client.off(Mqtt.Event.Disconnect);
            client.off(Mqtt.Event.Message);
            client.off(Mqtt.Event.Error);
        } catch {
            // best effort - failing to detach listeners must never block the retry loop
        }
        try {
            client.disconnect();
        } catch {
            // best effort - the attempt is already abandoned, nothing else we can do
        }
    }

    private doConnect(options: Mqtt.ConnectionOptions): Promise<boolean> {
        // Every attempt gets its own fresh native client (own native id, own native
        // callback reference). This is the core fix for the crash: previously all
        // retries reused the same Mqtt.Client/native id, so the native library's
        // single-slot connect callback for that id could be overwritten by a later
        // retry while an earlier, abandoned attempt was still running (the JS-side
        // timeout fires long before the real Paho timeout used to elapse). A late
        // completion of the abandoned attempt could then invoke a callback that had
        // already been invoked once by the newer attempt, tripping RN's single-shot
        // native Callback invariant and aborting the app.
        const client = new Mqtt.Client(this.nativeUri);
        this.currentAttemptClient = client;

        const isCurrentAttempt = () => this.currentAttemptClient === client;

        return new Promise<boolean>((resolve) => {
            let settled = false;

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
                this.abandonClient(client);
                resolve(false);
            };

            const onConnected = () => {
                if (!isCurrentAttempt() || settled) {
                    // Late success from an abandoned attempt - ignore entirely, a newer
                    // attempt has already resolved (or is in flight).
                    return;
                }
                settled = true;
                clearConnectTimeout();

                this.client = client;
                this.isConnected = true;
                this.logger.logEvent({ message: 'mqtt connected' });

                this.subscribePending();
                this.flushQueue();

                resolve(true);
            };

            const onDisconnected = (reason: string) => {
                if (!isCurrentAttempt()) return;

                if (!settled) {
                    // Disconnected before ever connecting - this attempt failed.
                    settleFailure('mqtt connection disconnected', reason);
                    return;
                }

                // Already connected once on this (still current/live) client - a real
                // disconnect during normal operation. autoReconnect is handled natively.
                this.isConnected = false;
                clearConnectTimeout();
                this.prepareSubscriptionsForReconnect();
                this.logger.logEvent({ message: 'mqtt connection disconnected', reason });
            };

            const onError = (err: string) => {
                if (!isCurrentAttempt()) return;

                if (!settled) {
                    settleFailure('mqtt error', err);
                    return;
                }

                clearConnectTimeout();
                this.logger.logEvent({ message: 'mqtt error', info: err });
            };

            client.on(Mqtt.Event.Connect, onConnected);
            client.on(Mqtt.Event.Disconnect, onDisconnected);
            client.on(Mqtt.Event.Message, this.onMessage.bind(this));
            client.on(Mqtt.Event.Error, onError);

            const onTimeout = () => settleFailure('mqtt timeout');
            this.toConnect = setTimeout(onTimeout, CONNECT_TIMEOUT + 2000)

            this.logger.logEvent({ message: 'trying to connect to mqtt' });

            client.connect(options, (error?: Error) => {
                if (error !== null && error !== undefined) {
                    settleFailure('mqtt connect callback error', error.message);
                }
            });
        });
    }

    private flushQueue() {
        if (!this.queue) return;

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

    protected getSecret(key: string) {
        return getSecretBinding().getSecret(key);
    }
}

export const getMessageQueueBinding = () => MessageQueue.getInstance();
