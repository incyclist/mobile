import { ActivityInfoUI, ActivityDetails } from 'incyclist-services';

export interface ActivityListItemProps {
    activityInfo: ActivityInfoUI;
    onPress: (id: string) => void;
    outsideFold?: boolean;
}

export interface ActivityListItemViewProps {
    title: string;
    dateStr: string;
    timeStr: string;
    durationStr: string;
    distanceValue: string;
    distanceUnit: string;
    elevationValue: string;
    elevationUnit: string;
    details: ActivityDetails | undefined;
    compact: boolean;
    outsideFold: boolean;
    ftp?:number
    onPress: () => void;
}

export const ACTIVITY_LIST_ITEM_HEIGHT = 72;