import { TRideView, TRideViewOption } from 'incyclist-services';

export interface RideSettingsProps {
    onClose: () => void;
}

export interface RideSettingsViewProps {
    rideView: TRideView;
    rideViewOptions: Map<TRideView, TRideViewOption>;
    onClose: () => void;
    onChangeRideView: (value: TRideView) => void;
}