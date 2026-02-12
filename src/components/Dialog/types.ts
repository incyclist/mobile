import { StyleProp, ViewStyle } from 'react-native';
import {  ButtonProps } from '../ButtonBar/types';

export interface DialogProps {
    title: string;
    onOutsideClick?: () => void;
    visible?: boolean;
    buttons?: Array<ButtonProps>
    style?: StyleProp<ViewStyle>; 
}

