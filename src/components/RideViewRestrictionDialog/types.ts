import { RideViewRestrictionDialogProps } from 'incyclist-services';

export interface RideViewRestrictionDialogComponentProps {
    /** content decided by the page service */
    dialog: RideViewRestrictionDialogProps;
    onClose: () => void;
    /** the rider confirmed to discard the simulated ride and connect a device */
    onDiscard: () => void;
    onReminderChanged: (enabled: boolean) => void;
}
