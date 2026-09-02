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
 * No `onNoPanorama`/`onPanoramaChanged` - a satellite update is a camera move over
 * already-loaded tiles, not a fetch that can fail. `onLicenseConsumed` stays optional
 * in the shared spec but is Android-only in practice: Android's Maps SDK bills per map
 * instantiation, MapKit has no equivalent, so iOS never fires it. `readyTimeout` only
 * matters where map init is async and can fail to answer (Android); iOS may ignore it.
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
