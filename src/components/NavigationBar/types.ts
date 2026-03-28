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
    onClick: (item: TNavigationItem) => void;
    compact?: boolean;
}

export interface NavigationBarViewProps {
    selected?: TNavigationItem;
    onClick: (item: TNavigationItem) => void;
    compact?: boolean;
    iconSize: number;
    navWidth: number;
    showExit: boolean;
    navHeight?: number; // Added as per requirement
    // showBackOnly and onBack props are removed as the feature is no longer supported.
}

export interface NavigationBarViewCompactProps {
    selected?: TNavigationItem;
    onClick: (item: TNavigationItem) => void;
    navHeight: number;
    showExit: boolean; // Although always false for compact, it's part of the requested interface.
}