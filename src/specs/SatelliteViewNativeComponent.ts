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
 * Deliberately narrower than StreetViewNativeComponent's contract:
 *
 * - no `heading`: the camera is fixed at a 45 deg pitch with no facing direction
 *   (satellite-view-mobile-design.md 2.4).
 * - no `onLicenseConsumed`: iOS renders Apple MapKit imagery, which has no per-load
 *   billing event comparable to Google's charge per GMSPanoramaView instantiation, so
 *   there is nothing for the event to represent. Omitted, not stubbed
 *   (satellite-view-mobile-design.md 2.8). Android, which does use Google imagery, is
 *   expected to declare it - this spec is iOS-shaped only for as long as that is true.
 * - no `onNoPanorama` / `onPanoramaChanged`: Street-View-specific, there is no
 *   "no imagery at this position" failure mode for a tile-based satellite map.
 * - no `readyTimeout` / `positionTimeout`: there is no fetch to time out. The native
 *   side keeps a single internal safety timeout so onLoaded can never be withheld
 *   forever; it is not tunable from JS.
 */
export interface NativeProps extends ViewProps {
    latitude: CodegenTypes.Double;
    longitude: CodegenTypes.Double;
    onLoaded?: CodegenTypes.BubblingEventHandler<{}> | null;
    onError?: CodegenTypes.BubblingEventHandler<OnErrorEvent> | null;
    onLog?: CodegenTypes.BubblingEventHandler<OnLogEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
    'SatelliteView',
) as HostComponent<NativeProps>;
