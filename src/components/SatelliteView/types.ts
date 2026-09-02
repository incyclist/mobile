import { StyleProp, ViewStyle } from 'react-native';

/** Same shape as Street View's IPosition - satellite rotates with heading too. */
export interface IPosition {
    lat: number;
    lng: number;
    heading: number;
}

export type SatelliteViewErrorReason = 'unavailable' | 'unknown';

export interface SatelliteViewProps {
    position?: IPosition;
    style?: StyleProp<ViewStyle>;
    onLoaded?: () => void;
    onError?: (reason: SatelliteViewErrorReason) => void;
}
