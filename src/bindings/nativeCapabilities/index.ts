import { NativeModules } from 'react-native';
import { EventLogger } from 'gd-eventlog';

/** The native app can do the link control connection and discovery. */
export const NATIVE_FEATURE_LOCAL_LINK = 'local-link';
/** Reserved: Android loopback pipe / network configuration present. Not reported by any binary yet. */
export const NATIVE_FEATURE_LOCAL_LINK_MEDIA = 'local-link-media';

let cached: string[] | undefined;

const logError = (err: any, fn: string): void => {
    try {
        new EventLogger('NativeCapabilities').logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack });
    } catch {
        // nothing left to report to
    }
};

const readCapabilities = (): string[] => {
    try {
        const list = NativeModules?.NativeCapabilities?.capabilities;
        if (!Array.isArray(list))
            return [];
        return list.filter((c): c is string => typeof c === 'string');
    }
    catch (err: any) {
        logError(err, 'readCapabilities');
        return [];
    }
};

/**
 * The capabilities the installed native binary signals. A binary without the NativeCapabilities
 * module (an old binary reached by a hot update, or jest) reports none. Read once, never throws.
 */
export const getNativeCapabilities = (): string[] => {
    try {
        cached ??= readCapabilities();
        return cached;
    }
    catch (err: any) {
        logError(err, 'getNativeCapabilities');
        return [];
    }
};

export const hasNativeFeature = (name: string): boolean => {
    try {
        return getNativeCapabilities().includes(name);
    }
    catch (err: any) {
        logError(err, 'hasNativeFeature');
        return false;
    }
};

/** test helper */
export const resetNativeCapabilitiesCache = (): void => {
    cached = undefined;
};
