export interface RideMenuProps {
    visible: boolean;
    finished?:boolean;
    onClose: () => void;
    onCloseRidePage?:()=> void;
}

export type ActiveDialog = 'gearSettings' | 'rideSettings' | 'activitySummary' | 'workoutSettings' | null;

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
    // Menu gains Step Back / Step Forward / Increase / Decrease Load / Workout Settings.
    //
    // `workout` and `loadControl` are resolved service-side (RidePageService.menuProps) and
    // forwarded here verbatim by the smart RideMenu component - this pure view must not re-derive
    // them from ride type or cycling mode itself (services drives *what*, this view drives *how*
    // - workspace CLAUDE.md).
    workout?: boolean;
    canStepBack?: boolean;
    canStepForward?: boolean;
    onStepBack?: () => void;
    onStepForward?: () => void;
    // Resolved Load/Gear row state - undefined/`visible:false` means the row must not render at
    // all (LoadButtonMode==='hidden', no gear concept and nothing to nudge). Independent of
    // `workout` - a plain route ride (no workout attached) still needs Load/Gear buttons whenever
    // cycling mode calls for them. `buttons` gives each of the 4 magnitude buttons its own
    // resolved label (e.g. "+5W"/"-50W" or "+1"/"-5") - this view renders them as-is, it must not
    // compute Watt/gear-step wording itself.
    loadControl?: { visible: boolean, label?: 'Load' | 'Gear', buttons?: { inc1: string, dec1: string, inc5: string, dec5: string } };
    onIncreaseLoad?: () => void;
    onDecreaseLoad?: () => void;
    // Big-step equivalents (LARGE_LOAD_INCREMENT, matching the swipe gesture's left/right step) -
    // each button carries its own label, so there is no shared row-caption text a rider could tap
    // expecting it to do something (the original tablet layout bug this replaces).
    onIncreaseLoadBig?: () => void;
    onDecreaseLoadBig?: () => void;
    // Opens WorkoutSettingsDialog (session 5.10) - load-increment editing, gated by `workout`.
    onWorkoutSettings?: () => void;

    // Whether the Ride Settings (Ride View selector) tile applies - false only for a route-less
    // Workout-only ride, which has no view to select. Resolved service-side
    // (RidePageService.menuProps.showRideSettings), not derived from `workout` or ride type here.
    showRideSettings?: boolean;

    // the following props are required for Storybook
    renderGearSettings?: () => React.ReactNode;
    renderRideSettings?: () => React.ReactNode;
    renderActivitySummary?: () => React.ReactNode;
    renderWorkoutSettings?: () => React.ReactNode;
}
