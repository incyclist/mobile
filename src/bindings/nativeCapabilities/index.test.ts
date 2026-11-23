import { NativeModules, Platform } from 'react-native';
import { getNativeCapabilities, hasNativeFeature, resetNativeCapabilitiesCache } from './index';

describe('nativeCapabilities', () => {
    const modules = NativeModules as Record<string, unknown>;
    const originalOS = Platform.OS;

    afterEach(() => {
        delete modules.NativeCapabilities;
        Platform.OS = originalOS;
        resetNativeCapabilitiesCache();
    });

    test.each(['ios', 'android'] as const)('%s: reports a capability the module lists', (os) => {
        Platform.OS = os;
        modules.NativeCapabilities = { capabilities: ['local-link'] };
        expect(hasNativeFeature('local-link')).toBe(true);
        expect(hasNativeFeature('local-link-media')).toBe(false);
    });

    test('module absent (old binary): no capability', () => {
        expect(getNativeCapabilities()).toEqual([]);
        expect(hasNativeFeature('local-link')).toBe(false);
    });

    test('module without a list or with a wrong shape: no capability', () => {
        modules.NativeCapabilities = { capabilities: 'local-link' };
        expect(hasNativeFeature('local-link')).toBe(false);
    });

    test('non-string entries are ignored', () => {
        modules.NativeCapabilities = { capabilities: [1, null, 'local-link'] };
        expect(getNativeCapabilities()).toEqual(['local-link']);
    });

    test('a throwing module accessor never throws', () => {
        Object.defineProperty(modules, 'NativeCapabilities', { configurable: true, get: () => { throw new Error('boom'); } });
        expect(hasNativeFeature('local-link')).toBe(false);
    });

    test('the list is read once', () => {
        modules.NativeCapabilities = { capabilities: ['local-link'] };
        expect(hasNativeFeature('local-link')).toBe(true);
        delete modules.NativeCapabilities;
        expect(hasNativeFeature('local-link')).toBe(true);
    });
});
