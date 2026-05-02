import { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ButtonProps } from '../ButtonBar/types';

export type DialogVariant = 'info' | 'details' | 'full'; // default: 'informational'

export interface DialogProps {
    title: string;
    variant?: DialogVariant;
    minWidth?: DimensionValue;
    minHeight?: DimensionValue;
    height?: number;
    width?: number;
    onOutsideClick?: () => void;
    visible?: boolean;
    buttons?: ButtonProps[];
    style?: StyleProp<ViewStyle>;
    nested?: boolean;
    titleStyle?: StyleProp<TextStyle>;
    slideFrom?: 'left'; // only applies to variant='full'
}