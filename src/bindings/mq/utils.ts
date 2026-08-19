// Default ports of the *MQTT-over-TCP* schemes. A URI carrying one of these is a plain-TCP
// broker address, so the port has to be replaced when translating to WebSocket - a port
// that cannot serve WebSocket traffic must not be carried over. See toWebsocketUri().
const MQTT_TCP_PORTS = new Set([1883, 8883]);

const WS_DEFAULT_PORTS: Record<string, number> = {
    'ws:': 80,
    'wss:': 443,
};

// RabbitMQ's rabbitmq_web_mqtt plugin serves MQTT-over-WebSocket at /ws, and that is what
// the Traefik IngressRoute in `infra` routes to. Used only when the source URI carries no
// path of its own.
const DEFAULT_WS_PATH = '/ws';

// TCP scheme -> WebSocket scheme. Both the MQTT names and the Paho-style aliases are
// accepted, because a broker address has historically been written either way.
// Not global, so exec() carries no lastIndex state between calls.
const SCHEME_PATTERN = /^([a-z]+):\/\//;

const WS_SCHEME: Record<string, string> = {
    'mqtt:': 'ws:',
    'tcp:': 'ws:',
    'mqtts:': 'wss:',
    'ssl:': 'wss:',
    'ws:': 'ws:',
    'wss:': 'wss:',
};

export interface WebsocketMqttUri {
    /** The URI to hand to MQTT.js, e.g. `wss://mq.api.incyclist.com:443/ws` */
    uri: string;
    /** True when the connection is TLS-encrypted (`wss:`) */
    tls: boolean;
}

/**
 * Translates a broker URI into an MQTT-over-WebSocket URI.
 *
 * The input is this platform's default or the `mq.broker` settings override. A URI that is
 * already `ws:`/`wss:` is only normalised (port + path filled in); one written for the TCP
 * transport - the way the broker is usually referred to - is translated:
 *
 * | Input                              | Output                                  | tls   |
 * |------------------------------------|-----------------------------------------|-------|
 * | `mqtt://host`                      | `ws://host:80/ws`                       | false |
 * | `tcp://host:1883`                  | `ws://host:80/ws`                       | false |
 * | `mqtts://host`                     | `wss://host:443/ws`                     | true  |
 * | `ssl://host:8883`                  | `wss://host:443/ws`                     | true  |
 * | `wss://host/mqtt`                  | `wss://host:443/mqtt`                   | true  |
 * | `wss://host:15675/ws`              | `wss://host:15675/ws`                   | true  |
 *
 * A port is only dropped when it is one of the MQTT-over-TCP defaults (1883/8883), since
 * that port cannot possibly serve WebSocket traffic. Any other explicit port is a
 * deliberate choice by whoever set the override and is preserved as-is.
 *
 * Malformed URIs are returned unchanged with `tls: false`, matching the previous
 * behaviour - a bad value must never throw on the connect path.
 */
export function toWebsocketUri(uri: string): WebsocketMqttUri {
    /*
        Hermes handles non-standard URL schemes differently from Node.js.
        new URL('mqtts://...') returns an empty hostname in Hermes because mqtts: is not a
        recognised scheme, so the scheme is swapped for http(s): before parsing.
    */
    const schemeMatch = SCHEME_PATTERN.exec(uri ?? '');
    if (!schemeMatch) return { uri, tls: false };

    const sourceScheme = schemeMatch[1] + ':';
    const targetScheme = WS_SCHEME[sourceScheme];
    if (!targetScheme) return { uri, tls: false };

    const tls = targetScheme === 'wss:';
    const parseable = uri.replace(/^[a-z]+:\/\//, tls ? 'https://' : 'http://');

    let parsed: URL;
    try {
        parsed = new URL(parseable);
    } catch {
        return { uri, tls: false };
    }

    const host = parsed.hostname;
    if (!host) return { uri, tls: false };

    const sourcePort = parsed.port ? Number.parseInt(parsed.port, 10) : null;
    const keepPort = sourcePort !== null && !MQTT_TCP_PORTS.has(sourcePort);
    const port = keepPort ? sourcePort : WS_DEFAULT_PORTS[targetScheme];

    const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : DEFAULT_WS_PATH;

    return { uri: `${targetScheme}//${host}:${port}${path}`, tls };
}
