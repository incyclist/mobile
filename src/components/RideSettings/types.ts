import { TRideView,RideSettingsDisplayProps } from 'incyclist-services';

export interface RideSettingsProps {
    onClose: () => void;
    isRide?:boolean;
    /** the rider wants to know why a view is not available (link below the view selector) */
    onShowRideViewHelp?: () => void;
}

export interface RideSettingsViewProps extends RideSettingsDisplayProps {
    onClose: () => void;
    onChangeRideView: (value: TRideView) => void;
    onChangeVideoAudio: (value:boolean) => void;
    onShowRideViewHelp?: () => void;
}