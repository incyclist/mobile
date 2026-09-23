import type { WorkoutListContentProps } from 'incyclist-services';

export interface WorkoutsTableProps {
    data: WorkoutListContentProps;
    /** Phone (via `useScreenLayout()`) vs tablet — drives the slim, graph-less Upcoming rows on phone only. */
    compact: boolean;
    onSelectGroup: (group: string | null) => void;
}
