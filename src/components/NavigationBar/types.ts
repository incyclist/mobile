export type TNavigationItem =
    | 'user'
    | 'settings'
    | 'devices'
    | 'search'
    | 'routes'
    | 'workouts'
    | 'activities'
    | 'exit';

export type TPosition = 'left' | 'top'

export interface NavigationBarProps {
    position: TPosition;
    selected?: TNavigationItem;
    onClick: (item: TNavigationItem) => void;
    compact?: boolean;
}
