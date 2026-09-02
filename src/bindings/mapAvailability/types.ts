import type { TRideView } from 'incyclist-services';

/**
 * These mirror `IMapAvailabilityBinding`/`AvailabilityResult` in `incyclist-services`
 * (`src/api/mapAvailability/types.ts`). They are declared here rather than imported because
 * that module is not re-exported from the package root - `api/index.ts` exports `./bindings`
 * (which references the interface) but not `./mapAvailability/types` (which declares it), and
 * the package's `exports` map allows no deep imports. Nothing is lost by declaring them: the
 * assignment in `bindings/factory.ts` is checked structurally against the real interface, so
 * any drift between these and the published shape fails the type check there.
 */
export type AvailabilityStatus = 'available' | 'unavailable' | 'not-supported';

export interface AvailabilityResult {
    /**
     * `not-supported` - the native piece is not in this binary at all (tier 1). The option is
     * not offered.
     * `unavailable`   - the native piece exists but the device cannot run it (tier 2). The
     *                   option is offered, disabled, with `messageKey` explaining why.
     * `available`     - usable.
     */
    status: AvailabilityStatus;

    /**
     * Internal reason code, never display text. `services` owns the reason-code -> sentence
     * catalogue, because what to tell a rider is a content decision rather than a rendering
     * one. An unrecognised code falls back to a generic sentence there, so introducing one
     * ahead of its catalogue entry degrades rather than breaks.
     */
    messageKey?: string;
}

export type AvailabilityChangeCallback = (key: TRideView, result: AvailabilityResult) => void;

/**
 * What `NativeModules.MapAvailability` (Android only) answers. `available` is the Maps SDK's
 * own verdict; the rest is diagnostic context for the event log, not a decision input.
 */
export interface NativeMapStatus {
    available: boolean;
    reason?: string;
    apiKey?: string;
    playServices?: string;
    renderer?: string;
}

export interface NativeMapAvailability {
    getStatus(): Promise<NativeMapStatus>;
}
