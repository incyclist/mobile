import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type OnErrorEvent = { reason: string };

/**
 * Diagnostics from the native side. `detail` is a JSON object of extra fields, or '' when
 * there are none - a single string keeps the Codegen surface stable no matter what the
 * native code wants to report.
 */
type OnLogEvent = { message: string; detail: string };

export interface NativeProps extends ViewProps {
    latitude: CodegenTypes.Double;
    longitude: CodegenTypes.Double;
    heading: CodegenTypes.Double;
    readyTimeout?: CodegenTypes.Double;
    positionTimeout?: CodegenTypes.Double;
    onLicenseConsumed?: CodegenTypes.BubblingEventHandler<{}> | null;
    onLoaded?: CodegenTypes.BubblingEventHandler<{}> | null;
    onNoPanorama?: CodegenTypes.BubblingEventHandler<{}> | null;
    onPanoramaChanged?: CodegenTypes.BubblingEventHandler<{}> | null;
    onError?: CodegenTypes.BubblingEventHandler<OnErrorEvent> | null;
    onLog?: CodegenTypes.BubblingEventHandler<OnLogEvent> | null;
}

export default codegenNativeComponent<NativeProps>(
    'StreetView',
) as HostComponent<NativeProps>;