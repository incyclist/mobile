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
    // showBackOnly and onBack props are removed as the feature is no longer supported.
}