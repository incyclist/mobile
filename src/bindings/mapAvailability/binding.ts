import { AppState, AppStateStatus, NativeEventSubscription, Platform } from 'react-native';
import { EventLogger } from 'gd-eventlog';
import type { TRideView } from 'incyclist-services';
import { AvailabilityChangeCallback, AvailabilityResult } from './types';
import { getNativeMapAvailability, hasNativeComponent } from './native';

/** The native view component each ride view needs. `map` has none - it is always renderable. */
const NATIVE_COMPONENT: Partial<Record<TRideView, string>> = {
    sv: 'StreetView',
    sat: 'SatelliteView',
};

const AVAILABLE: AvailabilityResult = { status: 'available' };
const NOT_SUPPORTED: AvailabilityResult = { status: 'not-supported' };
const NEEDS_PLAY_SERVICES: AvailabilityResult = { status: 'unavailable', messageKey: 'need.playservices' };

/**
 * `unknown` is deliberately distinct from `unavailable`: it means the question could not be
 * answered (no native module, the call failed, the check has not returned yet), and is treated
 * as usable. Refusing a view because a probe was unavailable would be a regression on shipped
 * behaviour, where these views are simply always offered.
 */
type DeviceCapability = 'unknown' | 'available' | 'unavailable';

const sameResult = (a: AvailabilityResult | undefined, b: AvailabilityResult): boolean =>
    a?.status === b.status && a?.messageKey === b.messageKey;

/**
 * Whether a ride view can actually be rendered on this device, in this binary.
 *
 * Two tiers, evaluated in this order:
 *
 *  1. **Is the native component in this binary at all?** Android ships JS-only hot updates, so
 *     a bundle carrying satellite-view code can land on a native binary built before the
 *     component existed. Rendering it there would not degrade, it would throw. A view whose
 *     component is missing reports `not-supported` and is not offered.
 *  2. **Can the device run it?** Only asked once tier 1 has passed. On Android both Street View
 *     and satellite come from the Maps SDK and need working Play Services, so one shared native
 *     check answers for both. On iOS neither has a runtime precondition: satellite is MapKit,
 *     always present, and Street View's Google Maps key is written into the bundle by a build
 *     script that fails Release builds outright when it is missing - so there is no shipped iOS
 *     binary where the key is absent, and nothing to probe for.
 *
 * Sync and cached, so `RideSettingsDisplayService` can stay synchronous. Tier 1 is genuinely
 * instant. Tier 2 is a native round-trip, started off the app's startup path and reported
 * through `onChange` when it lands; until then the answer is the optimistic one, which is
 * exactly today's behaviour. A rider who installs or re-enables Play Services while the app is
 * backgrounded gets a fresh check when it returns to the foreground.
 */
export class MapAvailabilityBindingRN {

    private static instance: MapAvailabilityBindingRN;

    public static getInstance(): MapAvailabilityBindingRN {
        MapAvailabilityBindingRN.instance = MapAvailabilityBindingRN.instance ?? new MapAvailabilityBindingRN();
        return MapAvailabilityBindingRN.instance;
    }

    protected logger = new EventLogger('MapAvailability');

    /** tier 1, by component name. `undefined` value = probed, could not be answered. */
    protected components = new Map<string, boolean | undefined>();

    protected deviceCapability: DeviceCapability = 'unknown';

    /** last result reported per key, so `onChange` only fires on an actual change */
    protected results = new Map<TRideView, AvailabilityResult>();

    protected listeners: AvailabilityChangeCallback[] = [];
    protected started = false;
    protected appStateSubscription: NativeEventSubscription | undefined;

    /**
     * Kicks off the tier-2 check and starts watching for the capability changing underneath us.
     * Called from the bindings factory; also self-starting from `isAvailable()` so a caller
     * that arrives first still gets a check running.
     */
    start(): void {
        if (this.started)
            return;
        this.started = true;

        this.appStateSubscription = AppState.addEventListener('change', this.onAppStateChange);

        // Deferred rather than awaited: the native side loads the Maps renderer on its first
        // call, which has no business sitting on the app's startup path.
        setTimeout(() => { this.refresh(); }, 0);
    }

    isAvailable(key: TRideView): AvailabilityResult {
        if (!this.started)
            this.start();

        const result = this.evaluate(key);
        this.results.set(key, result);
        return result;
    }

    onChange(cb: AvailabilityChangeCallback): void {
        this.listeners.push(cb);
    }

    /** Re-reads the device capability and reports any key whose answer changed. */
    async refresh(): Promise<void> {
        const capability = await this.readDeviceCapability();
        if (capability === this.deviceCapability)
            return;

        this.logger.logEvent({ message: 'map capability changed', from: this.deviceCapability, to: capability });
        this.deviceCapability = capability;
        this.publishChanges();
    }

    protected onAppStateChange = (state: AppStateStatus): void => {
        if (state === 'active')
            this.refresh();
    };

    protected evaluate(key: TRideView): AvailabilityResult {
        const component = NATIVE_COMPONENT[key];
        if (!component)
            return AVAILABLE;

        if (this.hasComponent(component) === false)
            return NOT_SUPPORTED;

        return this.deviceResult();
    }

    /** Tier 2. Only ever reached from `evaluate()`, i.e. once tier 1 has passed. */
    protected deviceResult(): AvailabilityResult {
        if (Platform.OS !== 'android')
            return AVAILABLE;

        return this.deviceCapability === 'unavailable' ? NEEDS_PLAY_SERVICES : AVAILABLE;
    }

    protected hasComponent(name: string): boolean | undefined {
        if (this.components.has(name))
            return this.components.get(name);

        const has = hasNativeComponent(name);
        this.components.set(name, has);

        if (has !== true)
            this.logger.logEvent({ message: 'native component not confirmed', component: name, has });

        return has;
    }

    protected async readDeviceCapability(): Promise<DeviceCapability> {
        if (Platform.OS !== 'android')
            return 'available';

        const native = getNativeMapAvailability();
        if (!native?.getStatus)
            return 'unknown';

        try {
            const status = await native.getStatus();
            this.logger.logEvent({ message: 'map availability checked', ...status });
            return status?.available ? 'available' : 'unavailable';
        }
        catch (err) {
            this.logger.logEvent({ message: 'map availability check failed', error: (err as Error)?.message });
            return 'unknown';
        }
    }

    /**
     * Only keys somebody has already asked about are re-evaluated: a "change" for a view nobody
     * has ever looked at is noise, and `isAvailable()` computes fresh on every call anyway, so
     * an unqueried key loses nothing by having no cached entry.
     */
    protected publishChanges(): void {
        Array.from(this.results.keys()).forEach(key => {
            const previous = this.results.get(key);
            const result = this.evaluate(key);
            this.results.set(key, result);

            if (previous && !sameResult(previous, result))
                this.emit(key, result);
        });
    }

    protected emit(key: TRideView, result: AvailabilityResult): void {
        this.listeners.forEach(cb => {
            try {
                cb(key, result);
            }
            catch (err) {
                this.logger.logEvent({ message: 'onChange listener failed', error: (err as Error)?.message });
            }
        });
    }
}
