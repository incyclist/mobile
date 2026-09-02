import { StyleProp, ViewStyle } from 'react-native';

/**
 * Only lat/lng: a satellite view has no facing direction, so unlike Street View's
 * IPosition there is no heading (satellite-view-mobile-design.md 2.4).
 */
export interface IPosition {
    lat: number;
    lng: number;
}

export type SatelliteViewErrorReason = 'unavailable' | 'unknown';

export interface SatelliteViewProps {
    position?: IPosition;
    style?: StyleProp<ViewStyle>;
    onLoaded?: () => void;
    onError?: (reason: SatelliteViewErrorReason) => void;
}
