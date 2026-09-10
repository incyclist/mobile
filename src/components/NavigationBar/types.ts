import { StyleProp, ViewStyle } from 'react-native';

export type TNavigationItem =
    | 'user'
    | 'settings'
    | 'devices'
    | 'search'
    | 'routes'
    | 'workouts'
    | 'activities'
    | 'exit';

export interface NavigationBarProps {
    selected?: TNavigationItem;
    disabled?: boolean
    onClick: (item: TNavigationItem) => void;
    compact?: boolean;
}

export interface NavigationBarViewProps {
    selected?: TNavigationItem;
    onClick: (item: TNavigationItem) => void;
    disabled?: boolean;
    compact?: boolean;
    iconSize: number;
    navWidth: number;
    showExit: boolean;
}

export interface NavigationBarViewCompactProps {
    selected?: TNavigationItem;
    disabled?: boolean;
    onClick: (item: TNavigationItem) => void;
    showExit: boolean;
    // Lets a caller with a definite-height container (e.g. ListPageShell's navColumnCompact box)
    // stretch this bar to fill it (style={{flex:1}}) instead of it sizing to its own intrinsic
    // content - left undefined, standalone/Storybook usage keeps its natural size unchanged.
    style?: StyleProp<ViewStyle>;
}