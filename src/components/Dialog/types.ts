import { ReactNode } from 'react';
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
    /**
     * Optional content rendered as a non-scrolling sibling between the ScrollView (or plain
     * View, when `scrollable=false`) and the buttons footer. Use this for content that must
     * always stay visible regardless of how tall `children` renders - e.g. a status/error
     * message that explains why the footer's primary action is unavailable. Unlike `children`,
     * this slot is never pushed below the scrollable fold and never affected by `scrollable`.
     */
    belowContent?: ReactNode;
    /**
     * When false, Dialog renders `children` in a plain View instead of wrapping them in its
     * own ScrollView. Use this when `children` already manage their own internal scrolling
     * (e.g. a scrollable list with a fixed footer below it) - nesting that inside Dialog's
     * ScrollView leaves the inner scroll area's height undefined (a ScrollView lets its content
     * overflow rather than constraining it, so a `height: '100%'` child has no definite parent
     * size to resolve against) and causes RN's gesture responder to fight over the scroll
     * gesture between the two nested ScrollViews. Defaults to true to preserve existing
     * behaviour for all other Dialog consumers.
     */
    scrollable?: boolean;
}