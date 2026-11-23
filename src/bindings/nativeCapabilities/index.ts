import { NativeModules } from 'react-native';

/** The native app can do the link control connection and discovery. */
export const NATIVE_FEATURE_LOCAL_LINK = 'local-link';
/** Reserved: Android loopback pipe / network configuration present. Not reported by any binary yet. */
export const NATIVE_FEATURE_LOCAL_LINK_MEDIA = 'local-link-media';

let cached: string[] | undefined;

const readCapabilities = (): string[] => {
    try {
        const list = NativeModules?.NativeCapabilities?.capabilities;
        if (!Array.isArray(list))
            return [];
        return list.filter((c): c is string => typeof c === 'string');
    }
    catch {
        return [];
    }
};

/**
 * The capabilities the installed native binary signals. A binary without the NativeCapabilities
 * module (an old binary reached by a hot update, or jest) reports none. Read once, never throws.
 */
export const getNativeCapabilities = (): string[] => {
    cached ??= readCapabilities();
    return cached;
};

export const hasNativeFeature = (name: string): boolean => getNativeCapabilities().includes(name);

/** test helper */
export const resetNativeCapabilitiesCache = (): void => {
    cached = undefined;
};
