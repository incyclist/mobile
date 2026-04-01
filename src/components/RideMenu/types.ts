export interface RideMenuProps {
    visible: boolean;
    onClose: () => void;
}

export type ActiveDialog = 'gearSettings' | 'rideSettings' | 'activitySummary' | null;

export interface RideMenuViewProps {
    visible: boolean;
    showResume: boolean;
    activeDialog: ActiveDialog;
    onClose: () => void; // This is the menu's onClose, which the smart component wraps
    onPause: () => void;
    onResume: () => void;
    onEndRide: () => void;
    onGearSettings: () => void;
    onRideSettings: () => void;
    onDialogClose: () => void; // Generic dialog close for GearSettings, RideSettingsPlaceholder
    onExitFromSummary: () => void; // Specific exit for ActivitySummaryDialog (e.g., calls service.onEndRide)

    // the following props are required for Storybook
    renderGearSettings?: () => React.ReactNode;
    renderRideSettings?: () => React.ReactNode;
    renderActivitySummary?: () => React.ReactNode;
}