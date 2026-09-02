import { NativeModules, UIManager } from 'react-native';
import type { NativeMapAvailability } from './types';

type ComponentProbe = { hasViewManagerConfig?: (name: string) => boolean };

/**
 * Whether a Fabric native view component is compiled into the binary that is running.
 *
 * `NativeModules.<Name>` - the obvious lookup - does not answer this. StreetView and
 * SatelliteView are view managers, registered through `createViewManagers`, and view managers
 * are not TurboModules: under bridgeless they never appear in `NativeModules` at all, so that
 * lookup reports "absent" for a component that is present and working.
 * `UIManager.hasViewManagerConfig` is the check that actually consults the native component
 * registry, and it answers `false` rather than throwing for a component that is not there.
 *
 * Returns `undefined` when the question could not be asked - the registry global is not
 * installed outside a real app runtime (jest, for one). Callers treat that as "no information",
 * not as "absent": hiding a working feature because the probe was unavailable would be worse
 * than the crash risk it exists to prevent, and every environment where it is unavailable is
 * one where nothing is being rendered anyway.
 */
export const hasNativeComponent = (name: string): boolean | undefined => {
    try {
        const probe = UIManager as unknown as ComponentProbe;
        const has = probe?.hasViewManagerConfig?.(name);
        if (typeof has === 'boolean')
            return has;
    }
    catch {
        // registry global not installed - fall through
    }

    try {
        if (NativeModules?.[name])
            return true;
    }
    catch {
        // NativeModules proxy can throw on an unknown name in some hosts
    }

    return undefined;
};

/**
 * The Android-only device-capability module. Absent on iOS by design (MapKit needs no
 * precondition and the Google Maps key iOS Street View needs is guaranteed by a build script
 * that fails Release builds without one), and absent on any Android binary older than the one
 * that first shipped it - which a JS-only hot update can reach. Both are "no answer", never
 * "unavailable".
 */
export const getNativeMapAvailability = (): NativeMapAvailability | undefined => {
    try {
        return NativeModules?.MapAvailability as NativeMapAvailability | undefined;
    }
    catch {
        return undefined;
    }
};
