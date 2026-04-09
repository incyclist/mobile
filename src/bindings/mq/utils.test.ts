import { normaliseMqttUri } from './utils';

describe('normaliseMqttUri', () => {
    // ─── mqtt:// ───────────────────────────────────────────────────────────────

    describe('mqtt:// scheme', () => {
        it('android — no port → tcp:// with default port 1883', () => {
            const result = normaliseMqttUri('mqtt://broker.example.com', 'android');
            expect(result.nativeUri).toBe('tcp://broker.example.com:1883');
            expect(result.tls).toBe(false);
        });

        it('android — explicit port → tcp:// with preserved port', () => {
            const result = normaliseMqttUri('mqtt://broker.example.com:1884', 'android');
            expect(result.nativeUri).toBe('tcp://broker.example.com:1884');
            expect(result.tls).toBe(false);
        });

        it('ios — no port → mqtt:// with default port 1883', () => {
            const result = normaliseMqttUri('mqtt://broker.example.com', 'ios');
            expect(result.nativeUri).toBe('mqtt://broker.example.com:1883');
            expect(result.tls).toBe(false);
        });

        it('ios — explicit port → mqtt:// with preserved port', () => {
            const result = normaliseMqttUri('mqtt://broker.example.com:1884', 'ios');
            expect(result.nativeUri).toBe('mqtt://broker.example.com:1884');
            expect(result.tls).toBe(false);
        });
    });

    // ─── mqtts:// ──────────────────────────────────────────────────────────────

    describe('mqtts:// scheme', () => {
        it('android — no port → ssl:// with default port 8883', () => {
            const result = normaliseMqttUri('mqtts://broker.example.com', 'android');
            expect(result.nativeUri).toBe('ssl://broker.example.com:8883');
            expect(result.tls).toBe(true);
        });

        it('android — explicit port → ssl:// with preserved port', () => {
            const result = normaliseMqttUri('mqtts://broker.example.com:8884', 'android');
            expect(result.nativeUri).toBe('ssl://broker.example.com:8884');
            expect(result.tls).toBe(true);
        });

        it('android — mqtts://mq.api.incyclist.com', () => {
            const result = normaliseMqttUri('mqtts://mq.api.incyclist.com', 'android');
            expect(result.nativeUri).toBe('ssl://mq.api.incyclist.com:8883');
            expect(result.tls).toBe(true);
        });


        

        it('ios — no port → mqtts:// with default port 8883', () => {
            const result = normaliseMqttUri('mqtts://broker.example.com', 'ios');
            expect(result.nativeUri).toBe('mqtts://broker.example.com:8883');
            expect(result.tls).toBe(true);
        });

        it('ios — explicit port → mqtts:// with preserved port', () => {
            const result = normaliseMqttUri('mqtts://broker.example.com:8884', 'ios');
            expect(result.nativeUri).toBe('mqtts://broker.example.com:8884');
            expect(result.tls).toBe(true);
        });
    });

    // ─── tcp:// passthrough ────────────────────────────────────────────────────

    describe('tcp:// passthrough', () => {
        it('android — no port → tcp:// unchanged with default port', () => {
            const result = normaliseMqttUri('tcp://broker.example.com', 'android');
            expect(result.nativeUri).toBe('tcp://broker.example.com:1883');
            expect(result.tls).toBe(false);
        });

        it('android — explicit port preserved', () => {
            const result = normaliseMqttUri('tcp://broker.example.com:1884', 'android');
            expect(result.nativeUri).toBe('tcp://broker.example.com:1884');
            expect(result.tls).toBe(false);
        });
    });

    // ─── ssl:// passthrough ────────────────────────────────────────────────────

    describe('ssl:// passthrough', () => {
        it('android — no port → ssl:// unchanged with default port', () => {
            const result = normaliseMqttUri('ssl://broker.example.com', 'android');
            expect(result.nativeUri).toBe('ssl://broker.example.com:8883');
            expect(result.tls).toBe(true);
        });

        it('android — explicit port preserved', () => {
            const result = normaliseMqttUri('ssl://broker.example.com:8884', 'android');
            expect(result.nativeUri).toBe('ssl://broker.example.com:8884');
            expect(result.tls).toBe(true);
        });
    });

    // ─── malformed URI ─────────────────────────────────────────────────────────

    describe('malformed URI', () => {
        it('returns uri unchanged with tls false — does not throw', () => {
            const bad = 'not a uri at all';
            const result = normaliseMqttUri(bad, 'android');
            expect(result.nativeUri).toBe(bad);
            expect(result.tls).toBe(false);
        });

        it('empty string — does not throw', () => {
            const result = normaliseMqttUri('', 'android');
            expect(result.nativeUri).toBe('');
            expect(result.tls).toBe(false);
        });
    });
});