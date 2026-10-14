import { TRideView,RideSettingsDisplayProps } from 'incyclist-services';

export interface RideSettingsProps {
    onClose: () => void;
    isRide?:boolean;
}

export interface RideSettingsViewProps extends RideSettingsDisplayProps {
    onClose: () => void;
    onChangeRideView: (value: TRideView) => void;
    onChangeVideoAudio: (value:boolean) => void;
}