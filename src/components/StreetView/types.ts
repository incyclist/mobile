import { StyleProp, ViewStyle } from 'react-native';

export interface IPosition {
    lat: number;
    lng: number;
    heading: number;
}

export type StreetViewErrorReason = 'unavailable' | 'unknown';

export interface StreetViewProps {
    position?: IPosition;
    style?: StyleProp<ViewStyle>;
    readyTimeout?: number;
    positionTimeout?: number;
    onLicenseConsumed?: () => void;
    onLoaded?: () => void;
    onError?: (reason: StreetViewErrorReason) => void;
    onNoPanorama?: () => void;
    onPanoramaChanged?: () => void;
}