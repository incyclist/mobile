import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type OnErrorEvent = { reason: string };

/**
 * Diagnostics from the native side. `detail` is a JSON object of extra fields, or '' when
 * there are none - a single string keeps the Codegen surface stable no matter what the
 * native code wants to report. Same shape as StreetView's onLog.
 */
type OnLogEvent = { message: string; detail: string };

/**
 * Satellite View native component spec - shared by both platforms.
 *
 * Deliberately narrower than StreetViewNativeComponent:
 *
 * - No `heading`. The camera is fixed (45 deg tilt, north-up) and non-interactive, so there is
 *   nothing for a heading to steer. Desktop's Google Maps JS view does pass a heading; mobile
 *   does not follow it, by design.
 * - No panorama events (`onNoPanorama`/`onPanoramaChanged`). There is no panorama to fetch -
 *   a satellite update is a camera move over already-loaded tiles.
 *
 * `onLicenseConsumed` is Android-only in practice: Android renders Google satellite imagery
 * through the Maps SDK, which bills per map instantiation, so the event marks that billable
 * moment. iOS renders Apple MapKit imagery, which has no comparable per-load billing model -
 * the prop stays in the shared spec but the iOS component simply never fires it. That is
 * intentional, not a missing implementation.
 *
 * `readyTimeout` is likewise only meaningful where the map engine is initialised
 * asynchronously and can fail to answer (Android's getMapAsync). iOS may ignore it.
 */
export interface NativeProps extends ViewProps {
    latitude: CodegenTypes.Double;
    longitude: CodegenTypes.Double;
    readyTimeout?: CodegenTypes.Double;
    onLicenseConsumed?: CodegenTypes.BubblingEventHandler<{}> | null;
    onLoaded?: CodegenTypes.BubblingEventHandler<{}> | null;
    onError?: CodegenTypes.BubblingEventHandler<OnErrorEvent> | null;
    onLog?: CodegenTypes.BubblingEventHandler<OnLogEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
    'SatelliteView',
) as HostComponent<NativeProps>;
