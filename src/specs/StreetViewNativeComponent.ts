import type { HostComponent, ViewProps } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
    latitude: Double;
    longitude: Double;
    heading: Double;
}

export default codegenNativeComponent<NativeProps>(
    'StreetView',
) as HostComponent<NativeProps>;