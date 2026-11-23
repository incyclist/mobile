import { DeviceEventEmitter, NativeModules } from 'react-native';
import { EventLogger } from 'gd-eventlog';
import type { IncyclistBindings } from 'incyclist-services';

type ILoopbackPipeBinding = NonNullable<IncyclistBindings['loopbackPipe']>;
type LoopbackPipeOptions = Parameters<ILoopbackPipeBinding['start']>[0];

/** what the Kotlin module (LoopbackPipeModule) exposes */
export interface NativeLoopbackPipeModule {
    start(upstreamHost: string, upstreamPort: number): Promise<number>;
    stop(port: number): Promise<void>;
}

export const NATIVE_DONE_EVENT = 'LoopbackPipeDone';

let _logger: EventLogger | undefined;
const getLogger = (): EventLogger => {
    _logger ??= new EventLogger('Incyclist');
    return _logger;
};
const logEvent = (event: Record<string, unknown>): void => {
    try {
        getLogger().logEvent(event);
    } catch {
        // logging must never throw
    }
};
const logError = (err: any, fn: string): void => {
    logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack });
};

export const getNativeLoopbackPipeModule = (): NativeLoopbackPipeModule | undefined => {
    try {
        const mod = NativeModules?.LoopbackPipe;
        if (typeof mod?.start === 'function' && typeof mod?.stop === 'function')
            return mod as NativeLoopbackPipeModule;
    } catch (err: unknown) {
        logError(err, 'getNativeLoopbackPipeModule');
    }
    return undefined;
};

/**
 * Loopback pipe that runs natively (Kotlin): the bytes never cross the JS bridge. Same contract as
 * the JS pipe. When the native listener cannot be started, `start` falls back to the given JS
 * pipe, so a broken native side never leaves media without a pipe. Never throws or rejects.
 */
export class NativeLoopbackPipeBinding implements ILoopbackPipeBinding {
    protected nativePorts = new Set<number>();
    protected subscription?: { remove: () => void };

    constructor(protected native: NativeLoopbackPipeModule, protected fallback: ILoopbackPipeBinding) {}

    async start(opts: LoopbackPipeOptions): Promise<{ port: number }> {
        try {
            const port = Number(await this.native.start(opts.upstreamHost, opts.upstreamPort));
            if (port > 0) {
                this.nativePorts.add(port);
                this.listen();
                return { port };
            }
            logEvent({ message: 'loopback pipe: native start failed, using JS pipe' });
        } catch (err: unknown) {
            logError(err, 'NativeLoopbackPipeBinding.start');
        }
        return this.fallback.start(opts);
    }

    async stop(port?: number): Promise<void> {
        try {
            if (port === undefined) {
                this.nativePorts.clear();
                await this.native.stop(-1);
                await this.fallback.stop();
                return;
            }
            if (this.nativePorts.delete(port)) await this.native.stop(port);
            else await this.fallback.stop(port);
        } catch (err: unknown) {
            logError(err, 'NativeLoopbackPipeBinding.stop');
        }
    }

    /** per-connection throughput counters; no addresses, no tokens */
    protected listen(): void {
        if (this.subscription) return;
        try {
            this.subscription = DeviceEventEmitter.addListener(NATIVE_DONE_EVENT, (e: any) => {
                try {
                    const bytesUp = Number(e?.bytesUp) || 0;
                    const bytesDown = Number(e?.bytesDown) || 0;
                    const durationMs = Number(e?.durationMs) || 0;
                    logEvent({
                        message: 'loopback pipe request done',
                        bytesUp,
                        bytesDown,
                        durationMs,
                        bytesPerSecond: durationMs > 0 ? Math.round((bytesDown * 1000) / durationMs) : undefined,
                    });
                } catch (err: unknown) {
                    logError(err, 'NativeLoopbackPipeBinding.done');
                }
            });
        } catch (err: unknown) {
            logError(err, 'NativeLoopbackPipeBinding.listen');
        }
    }
}
