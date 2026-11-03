import { RideViewNoticeActionId, RideViewRestrictionNoticeProps } from 'incyclist-services';

export interface RideViewRestrictionNoticeComponentProps {
    /** from the page service; stateful (not one-shot), identified by `notice.id` */
    notice?: RideViewRestrictionNoticeProps;
    onAction: (id: RideViewNoticeActionId) => void;
    /** the rider closed the notice, or its time ran out */
    onClose: () => void;
}
