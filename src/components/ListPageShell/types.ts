import { ReactNode } from 'react';
import { TNavigationItem } from '../NavigationBar/types';

export interface ListPageShellProps {
    /** Height-based compact/normal switch, computed by each page (`height < 420`). */
    compact: boolean;
    /** Which item the sidebar highlights as active. */
    navSelected: TNavigationItem;
    onNavigate: (item: TNavigationItem) => void;
    /** Uppercase page title shown centered in the header. */
    title: string;
    /** Left side of the header (e.g. RoutesPageView's sync spinner). Empty by default. */
    headerLeft?: ReactNode;
    /** Right side of the header (e.g. an "Import ..." button, download pill/modal). Empty by default. */
    headerRight?: ReactNode;
    /** Extra content rendered between the header and the list area (e.g. RoutesPageView's FilterPanel). */
    belowHeader?: ReactNode;
    /** The list area's content - each page owns its own loading/empty-state branching. */
    children: ReactNode;
}
