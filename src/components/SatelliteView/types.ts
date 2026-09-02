import { StyleProp, ViewStyle } from 'react-native';

/**
 * Same shape as Street View's IPosition - satellite rotates with heading too, matching
 * desktop's rotating camera (satellite-view-mobile-design.md 2.4).
 */
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
