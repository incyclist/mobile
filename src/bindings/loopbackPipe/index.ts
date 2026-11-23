import TcpSocket from 'react-native-tcp-socket';
import { EventLogger } from 'gd-eventlog';
import type { IncyclistBindings } from 'incyclist-services';

// the services package does not export the interface by name
type ILoopbackPipeBinding = NonNullable<IncyclistBindings['loopbackPipe']>;
type LoopbackPipeOptions = Parameters<ILoopbackPipeBinding['start']>[0];

const LOOPBACK_HOST = '127.0.0.1';
export const MAX_CONNECTIONS = 32;
export const CONNECT_TIMEOUT_MS = 10000;

let _logger: EventLogger | undefined;
const getLogger = (): EventLogger => {
    _logger ??= new EventLogger('Incyclist');
    return _logger;
};

// same event shape as the logError of the other bindings; logging itself must never throw
const logError = (err: any, fn: string): void => {
    try {
        getLogger().logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack });
    } catch {
        // nothing left to report to
    }
};

// minimal view on the sockets of react-native-tcp-socket (and node:net, for the tests)
interface PipeSocket {
    on(event: string, cb: (...args: any[]) => void): unknown;
    write(data: any): boolean;
    pause(): unknown;
    resume(): unknown;
    end(): unknown;
    destroy(): unknown;
}
interface PipeServer {
    on(event: string, cb: (...args: any[]) => void): unknown;
    listen(options: { port: number; host: string }, cb?: () => void): unknown;
    close(cb?: () => void): unknown;
    address(): { port: number } | null;
}

interface Pipe {
    server: PipeServer;
    connections: Set<{ close: () => void }>;
}

const safe = (fn: string, action: () => void): void => {
    try {
        action();
    } catch (err: unknown) {
        logError(err, fn);
    }
};

/**
 * Copies bytes between a phone-local TCP listener and one fixed upstream, so that the media
 * player of Android (which may only use cleartext HTTP to the loopback address) can reach the
 * media port of a computer on the LAN. No HTTP parsing; one upstream socket per accepted
 * connection; the upstream is fixed when the pipe is started.
 *
 * Nothing in here throws or rejects: failures are logged (counts and messages only, never
 * addresses) and `start` resolves with port 0.
 */
export class LoopbackPipeBinding implements ILoopbackPipeBinding {
    protected pipes = new Map<number, Pipe>();

    async start(opts: LoopbackPipeOptions): Promise<{ port: number }> {
        try {
            const { upstreamHost, upstreamPort } = opts;
            const pipe: Pipe = { server: undefined as unknown as PipeServer, connections: new Set() };
            const server = TcpSocket.createServer((socket: PipeSocket) => {
                safe('LoopbackPipeBinding.connection', () => this.onConnection(pipe, socket, upstreamHost, upstreamPort));
            }) as unknown as PipeServer;
            pipe.server = server;

            const port = await new Promise<number>((resolve) => {
                let done = false;
                const finish = (p: number) => {
                    if (!done) {
                        done = true;
                        resolve(p);
                    }
                };
                server.on('error', (err: unknown) => {
                    logError(err, 'LoopbackPipeBinding.server');
                    finish(0);
                });
                try {
                    // the library default would be 0.0.0.0 (all interfaces)
                    server.listen({ port: 0, host: LOOPBACK_HOST }, () => {
                        try {
                            finish(server.address()?.port ?? 0);
                        } catch (err: unknown) {
                            logError(err, 'LoopbackPipeBinding.listening');
                            finish(0);
                        }
                    });
                } catch (err: unknown) {
                    logError(err, 'LoopbackPipeBinding.listen');
                    finish(0);
                }
            });

            if (!port) {
                safe('LoopbackPipeBinding.start.close', () => server.close());
                return { port: 0 };
            }
            this.pipes.set(port, pipe);
            server.on('close', () => safe('LoopbackPipeBinding.serverClose', () => this.forget(port, pipe)));
            return { port };
        } catch (err: unknown) {
            logError(err, 'LoopbackPipeBinding.start');
            return { port: 0 };
        }
    }

    async stop(port?: number): Promise<void> {
        try {
            const ports = port === undefined ? [...this.pipes.keys()] : [port];
            for (const p of ports) {
                const pipe = this.pipes.get(p);
                if (!pipe) continue;
                this.pipes.delete(p);
                safe('LoopbackPipeBinding.stop.connections', () => [...pipe.connections].forEach((c) => c.close()));
                safe('LoopbackPipeBinding.stop.server', () => pipe.server.close());
            }
        } catch (err: unknown) {
            logError(err, 'LoopbackPipeBinding.stop');
        }
    }

    protected forget(port: number, pipe: Pipe): void {
        if (this.pipes.get(port) === pipe) this.pipes.delete(port);
    }

    protected onConnection(pipe: Pipe, client: PipeSocket, host: string, port: number): void {
        if (pipe.connections.size >= MAX_CONNECTIONS) {
            logError(new Error(`connection refused: limit of ${MAX_CONNECTIONS} reached`), 'LoopbackPipeBinding.connection');
            safe('LoopbackPipeBinding.refuse', () => client.destroy());
            return;
        }

        let closed = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let upstream: PipeSocket | undefined;
        const entry = { close: () => close() };

        const close = () => {
            if (closed) return;
            closed = true;
            if (timer) clearTimeout(timer);
            pipe.connections.delete(entry);
            safe('LoopbackPipeBinding.close.client', () => client.destroy());
            safe('LoopbackPipeBinding.close.upstream', () => upstream?.destroy());
        };
        const onError = (fn: string) => (err: unknown) => {
            logError(err, fn);
            close();
        };

        pipe.connections.add(entry);
        // hold the client's bytes back until the upstream is connected
        safe('LoopbackPipeBinding.pause', () => client.pause());
        client.on('error', onError('LoopbackPipeBinding.client'));
        client.on('close', () => safe('LoopbackPipeBinding.clientClose', close));

        timer = setTimeout(() => {
            logError(new Error('upstream connect timeout'), 'LoopbackPipeBinding.connect');
            close();
        }, CONNECT_TIMEOUT_MS);

        try {
            upstream = TcpSocket.createConnection({ host, port }, () => {
                safe('LoopbackPipeBinding.connected', () => {
                    if (timer) clearTimeout(timer);
                    timer = undefined;
                    if (closed || !upstream) {
                        close();
                        return;
                    }
                    this.link(client, upstream, close);
                    client.resume();
                });
            }) as unknown as PipeSocket;
            upstream.on('error', onError('LoopbackPipeBinding.upstream'));
            upstream.on('close', () => safe('LoopbackPipeBinding.upstreamClose', close));
        } catch (err: unknown) {
            onError('LoopbackPipeBinding.createConnection')(err);
        }
    }

    /** copies both directions, with backpressure through pause/resume */
    protected link(a: PipeSocket, b: PipeSocket, close: () => void): void {
        this.copy(a, b, close);
        this.copy(b, a, close);
    }

    protected copy(from: PipeSocket, to: PipeSocket, close: () => void): void {
        to.on('drain', () => safe('LoopbackPipeBinding.drain', () => from.resume()));
        from.on('data', (data: unknown) => {
            try {
                if (!to.write(data)) from.pause();
            } catch (err: unknown) {
                logError(err, 'LoopbackPipeBinding.data');
                close();
            }
        });
        // a clean end of one side: let the other side flush, then it closes by itself
        from.on('end', () => safe('LoopbackPipeBinding.end', () => to.end()));
    }
}

export const getLoopbackPipeBinding = (): ILoopbackPipeBinding => new LoopbackPipeBinding();
