import { ReactNode } from 'react';
import { TNavigationItem } from '../NavigationBar/types';

export interface TransitionShellProps {
    selected: TNavigationItem;
    /** Defaults to a no-op — `PageTransitionView` never wires a real handler since its
     *  NavigationBar is `disabled`. */
    onClick?: (item: TNavigationItem) => void;
    disabled?: boolean;
    /** The centered content area — an `ActivityIndicator` for `PageTransitionView`, a
     *  "Not yet implemented" message for `NotImplementedView`. */
    children: ReactNode;
}
