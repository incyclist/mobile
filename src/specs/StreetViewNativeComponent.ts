import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type OnErrorEvent = { reason: string };

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
}

export default codegenNativeComponent<NativeProps>(
    'StreetView',
) as HostComponent<NativeProps>;