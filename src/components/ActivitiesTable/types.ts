import { ActivityInfoUI } from 'incyclist-services';

export interface ActivitiesTableProps {
    activities: ActivityInfoUI[];
    onSelect: (id: string) => void;
}