import { TRideView } from 'incyclist-services';

export interface RideSettingsProps {
    onClose: () => void;
}

export interface RideSettingsViewProps {
    rideView: TRideView;
    rideViewOptions: Map<TRideView, string>;
    onClose: () => void;
    onChangeRideView: (value: TRideView) => void;
}