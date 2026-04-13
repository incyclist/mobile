import { ActivityInfoUI } from 'incyclist-services';

export interface ActivityListItemProps {
    activityInfo: ActivityInfoUI;
    onPress: (id: string) => void;
    outsideFold?: boolean;
}

export const ACTIVITY_LIST_ITEM_HEIGHT = 72;