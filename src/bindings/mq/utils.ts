export interface NormalisedMqttUri {
    nativeUri: string;
    tls: boolean;
}

const DEFAULT_PORTS: Record<string, number> = {
    'mqtt:': 1883,
    'mqtts:': 8883,
    'tcp:': 1883,
    'ssl:': 8883,
};

/**
 * Normalises a broker URI from the secrets store into the correct native URI
 * and TLS flag for the given platform.
 *
 * | Input scheme | Platform | Output nativeUri    | tls   |
 * |-------------|----------|---------------------|-------|
 * | mqtt://     | android  | tcp://host:port     | false |
 * | mqtt://     | ios      | mqtt://host:port    | false |
 * | mqtts://    | android  | ssl://host:port     | true  |
 * | mqtts://    | ios      | mqtts://host:port   | true  |
 * | tcp://      | android  | unchanged           | false |
 * | ssl://      | android  | unchanged           | true  |
 *
 * Malformed URIs are returned unchanged with tls: false.
 */
export function normaliseMqttUri(uri: string, platform: 'ios' | 'android'): NormalisedMqttUri {

    /*
            Hermes handles non-standard URL schemes differently from Node.js. 
            new URL('mqtts://...') returns an empty hostname in Hermes because mqtts: is not a recognised scheme.    
    */
    const schemeMatch = uri.match(/^([a-z]+):\/\//);
    if (!schemeMatch) return { nativeUri: uri, tls: false };

    const originalScheme = schemeMatch[1] + ':'; // e.g. 'mqtt:'

    const parseable = uri
        .replace(/^mqtt:\/\//, 'http://')
        .replace(/^mqtts:\/\//, 'https://')
        .replace(/^tcp:\/\//, 'http://')
        .replace(/^ssl:\/\//, 'https://');

    let parsed: URL;
    try {
        parsed = new URL(parseable);
    } catch {
        return { nativeUri: uri, tls: false };
    }

    const host = parsed.hostname;
    const explicitPort = parsed.port ? parseInt(parsed.port, 10) : null;

    const resolvePort = (defaultScheme: string): number => {
        return explicitPort !== null ? explicitPort : DEFAULT_PORTS[defaultScheme] ?? 1883;
    };

    switch (originalScheme) {
        case 'mqtt:': {
            const port = resolvePort('mqtt:');
            const nativeUri =
                platform === 'android'
                    ? `tcp://${host}:${port}`
                    : `mqtt://${host}:${port}`;
            return { nativeUri, tls: false };
        }

        case 'mqtts:': {
            const port = resolvePort('mqtts:');
            const nativeUri =
                platform === 'android'
                    ? `ssl://${host}:${port}`
                    : `mqtts://${host}:${port}`;
            return { nativeUri, tls: true };
        }

        case 'tcp:': {
            const port = resolvePort('tcp:');
            const nativeUri = `tcp://${host}:${port}`;
            return { nativeUri, tls: false };
        }

        case 'ssl:': {
            const port = resolvePort('ssl:');
            const nativeUri = `ssl://${host}:${port}`;
            return { nativeUri, tls: true };
        }

        default:
            return { nativeUri: uri, tls: false };
    }
}