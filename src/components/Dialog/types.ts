import { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ButtonProps } from '../ButtonBar/types';

export type DialogVariant = 'info' | 'details'; // default: 'informational'

export interface DialogProps {
    title: string;
    variant?: DialogVariant;
    minWidth?: DimensionValue;
    minHeight?: DimensionValue;
    height?: number;
    width?: number;
    onOutsideClick?: () => void;
    visible?: boolean;
    buttons?: Array<ButtonProps>;
    style?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
}
