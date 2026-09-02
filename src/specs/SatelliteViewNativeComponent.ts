import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type OnErrorEvent = { reason: string };

/**
 * Diagnostics from the native side. `detail` is a JSON object of extra fields, or '' when
 * there are none - a single string keeps the Codegen surface stable no matter what the
 * native code wants to report. Same shape as StreetViewNativeComponent's, so one log
 * query covers both components.
 */
type OnLogEvent = { message: string; detail: string };

/**
 * Satellite View native component spec - shared by both platforms.
 *
 * `heading` rotates the camera to match desktop exactly (desktop calls
 * `setOptions({center, heading, tilt:45})` on every update - satellite-view-mobile-design.md
 * 2.4). The camera stays non-interactive either way - no rotation gesture - heading is driven
 * purely by the prop, not touch input.
 *
 * Otherwise deliberately narrower than StreetViewNativeComponent's contract: no
 * `onNoPanorama` / `onPanoramaChanged` - Street-View-specific, there is no "no imagery at this
 * position" failure mode for a tile-based satellite map - a satellite update is a camera move
 * over already-loaded tiles, not a fetch.
 *
 * `onLicenseConsumed` stays in the shared spec (optional) but is Android-only in practice:
 * Android renders Google satellite imagery through the Maps SDK, which bills per map
 * instantiation, so the event marks that billable moment. iOS renders Apple MapKit
 * imagery, which has no comparable per-load billing model, so the iOS component simply
 * never fires it - that is intentional, not a missing implementation
 * (satellite-view-mobile-design.md 2.8). This mirrors StreetViewNativeComponent's own
 * shape (single shared spec, optional fields, platform decides what it fires) rather
 * than splitting into per-platform spec files.
 *
 * `readyTimeout` is likewise only meaningful where the map engine is initialised
 * asynchronously and can fail to answer (Android's getMapAsync). iOS may ignore it.
 */
export interface NativeProps extends ViewProps {
    latitude: CodegenTypes.Double;
    longitude: CodegenTypes.Double;
    heading: CodegenTypes.Double;
    readyTimeout?: CodegenTypes.Double;
    onLicenseConsumed?: CodegenTypes.BubblingEventHandler<{}> | null;
    onLoaded?: CodegenTypes.BubblingEventHandler<{}> | null;
    onError?: CodegenTypes.BubblingEventHandler<OnErrorEvent> | null;
    onLog?: CodegenTypes.BubblingEventHandler<OnLogEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
    'SatelliteView',
) as HostComponent<NativeProps>;
