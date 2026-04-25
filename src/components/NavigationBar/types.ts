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
}