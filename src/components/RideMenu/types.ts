export interface RideMenuProps {
    visible: boolean;
    showResume: boolean;       // true = show Resume button, false = show Pause button
    onClose: () => void;        // Close button (X) or Backdrop — closes the menu without affecting ride state
    onEndRide: () => void;      // End Ride — caller handles service call + navigation
    onPause: () => void;        // Called when user taps Pause
    onResume: () => void;       // Called when user taps Resume
    onSettings?: () => void;    // Optional — render item, disabled if undefined
    onCustomize?: () => void;   // Optional — render item, disabled if undefined
}
