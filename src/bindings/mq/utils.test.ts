import { toWebsocketUri } from './utils';

describe('toWebsocketUri', () => {

    // ─── mqtt:// / tcp:// → ws:// ──────────────────────────────────────────────

    describe('plain MQTT schemes', () => {
        it('mqtt:// — no port → ws:// on the default http port', () => {
            const result = toWebsocketUri('mqtt://broker.example.com');
            expect(result.uri).toBe('ws://broker.example.com:80/ws');
            expect(result.tls).toBe(false);
        });

        it('mqtt:// — the default MQTT port is replaced, not carried over', () => {
            const result = toWebsocketUri('mqtt://broker.example.com:1883');
            expect(result.uri).toBe('ws://broker.example.com:80/ws');
            expect(result.tls).toBe(false);
        });

        it('tcp:// — treated the same as mqtt://', () => {
            const result = toWebsocketUri('tcp://broker.example.com:1883');
            expect(result.uri).toBe('ws://broker.example.com:80/ws');
            expect(result.tls).toBe(false);
        });
    });

    // ─── mqtts:// / ssl:// → wss:// ────────────────────────────────────────────

    describe('TLS MQTT schemes', () => {
        it('mqtts:// — no port → wss:// on 443', () => {
            const result = toWebsocketUri('mqtts://broker.example.com');
            expect(result.uri).toBe('wss://broker.example.com:443/ws');
            expect(result.tls).toBe(true);
        });

        it('mqtts:// — the default MQTTS port is replaced by 443', () => {
            const result = toWebsocketUri('mqtts://broker.example.com:8883');
            expect(result.uri).toBe('wss://broker.example.com:443/ws');
            expect(result.tls).toBe(true);
        });

        it('ssl:// — treated the same as mqtts://', () => {
            const result = toWebsocketUri('ssl://broker.example.com:8883');
            expect(result.uri).toBe('wss://broker.example.com:443/ws');
            expect(result.tls).toBe(true);
        });

        it('translates the live broker address', () => {
            const result = toWebsocketUri('mqtts://mq.api.incyclist.com:8883');
            expect(result.uri).toBe('wss://mq.api.incyclist.com:443/ws');
            expect(result.tls).toBe(true);
        });

        it('keeps a port that is not an MQTT default — it was chosen deliberately', () => {
            const result = toWebsocketUri('mqtts://broker.example.com:9001');
            expect(result.uri).toBe('wss://broker.example.com:9001/ws');
            expect(result.tls).toBe(true);
        });
    });

    // ─── ws:// / wss:// passthrough ────────────────────────────────────────────

    describe('WebSocket schemes', () => {
        it('wss:// — normalised, not translated', () => {
            const result = toWebsocketUri('wss://mq.api.incyclist.com/ws');
            expect(result.uri).toBe('wss://mq.api.incyclist.com:443/ws');
            expect(result.tls).toBe(true);
        });

        it('wss:// — a custom port and path are preserved', () => {
            const result = toWebsocketUri('wss://mq.api.incyclist.com:15675/mqtt');
            expect(result.uri).toBe('wss://mq.api.incyclist.com:15675/mqtt');
            expect(result.tls).toBe(true);
        });

        it('ws:// — no port or path → defaults filled in', () => {
            const result = toWebsocketUri('ws://broker.example.com');
            expect(result.uri).toBe('ws://broker.example.com:80/ws');
            expect(result.tls).toBe(false);
        });
    });

    // ─── path handling ─────────────────────────────────────────────────────────

    describe('path handling', () => {
        it('adds the rabbitmq_web_mqtt default path when the source has none', () => {
            expect(toWebsocketUri('mqtts://broker.example.com').uri)
                .toBe('wss://broker.example.com:443/ws');
        });

        it('treats a bare / as no path', () => {
            expect(toWebsocketUri('mqtts://broker.example.com/').uri)
                .toBe('wss://broker.example.com:443/ws');
        });

        it('keeps an explicit path', () => {
            expect(toWebsocketUri('mqtts://broker.example.com/mqtt').uri)
                .toBe('wss://broker.example.com:443/mqtt');
        });
    });

    // ─── malformed / unsupported input ─────────────────────────────────────────

    describe('malformed URI', () => {
        it('returns uri unchanged with tls false — does not throw', () => {
            const bad = 'not a uri at all';
            const result = toWebsocketUri(bad);
            expect(result.uri).toBe(bad);
            expect(result.tls).toBe(false);
        });

        it('empty string — does not throw', () => {
            const result = toWebsocketUri('');
            expect(result.uri).toBe('');
            expect(result.tls).toBe(false);
        });

        it('an unsupported scheme is left alone', () => {
            const result = toWebsocketUri('http://broker.example.com');
            expect(result.uri).toBe('http://broker.example.com');
            expect(result.tls).toBe(false);
        });

        it('a scheme with no host is left alone', () => {
            const result = toWebsocketUri('mqtts://');
            expect(result.uri).toBe('mqtts://');
            expect(result.tls).toBe(false);
        });
    });
});
