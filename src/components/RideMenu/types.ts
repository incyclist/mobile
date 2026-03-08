export interface RideMenuProps {
    visible: boolean;
    onClose: () => void;        // Resume — closes the menu, caller resumes the ride
    onEndRide: () => void;      // End Ride — caller handles service call + navigation
    onSettings?: () => void;    // Optional — render item, disabled if undefined
    onCustomize?: () => void;   // Optional — render item, disabled if undefined
}
