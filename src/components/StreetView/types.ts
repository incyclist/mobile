import { StyleProp, ViewStyle } from 'react-native';

export interface StreetViewProps {
    latitude: number;
    longitude: number;
    heading: number;
    style?: StyleProp<ViewStyle>;
}