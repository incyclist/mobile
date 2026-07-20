export interface RideMenuProps {
    visible: boolean;
    finished?:boolean;
    // true when the ride has an associated workout (workout-only ride today; a GPX/Video ride
    // with an attached workout, phase 2, will also set this) - controls presence of the
    // Step Back/Step Forward/Increase-Decrease Load controls, wired to WorkoutRidePageService
    workout?: boolean;
    onClose: () => void;
    onCloseRidePage?:()=> void;
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

    // workout controls (HLD §3.2) - shown whenever the ride has an associated workout, regardless
    // of which ride screen hosts it. Footer is unchanged (same "End Ride" button, same
    // pause + ActivitySummaryDialog confirmation flow as any other ride) - in phase 1 a
    // workout-only ride has no route to fall back to, so ending the ride and stopping the
    // workout are the same action; a distinct "Stop Workout" action (stop workout, keep riding
    // in SIM mode) only makes sense once a ride can carry a workout AND a route, phase 2.
    // Menu gains Step Back / Step Forward / Increase / Decrease Load.
    workout?: boolean;
    canStepBack?: boolean;
    canStepForward?: boolean;
    onStepBack?: () => void;
    onStepForward?: () => void;
    onIncreaseLoad?: () => void;
    onDecreaseLoad?: () => void;

    // the following props are required for Storybook
    renderGearSettings?: () => React.ReactNode;
    renderRideSettings?: () => React.ReactNode;
    renderActivitySummary?: () => React.ReactNode;
}
