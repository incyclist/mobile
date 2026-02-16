import { StyleProp, ViewStyle } from 'react-native';
import {  ButtonProps } from '../ButtonBar/types';

export interface DialogProps {
    title: string;
    height?: number, 
    width?: number,
    onOutsideClick?: () => void;
    visible?: boolean;
    buttons?: Array<ButtonProps>
    style?: StyleProp<ViewStyle>; 
}

