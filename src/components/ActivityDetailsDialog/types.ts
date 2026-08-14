import { AttachedWorkoutProps, SelectedActivityDisplayProperties } from 'incyclist-services';

export interface ActivityDetailsDialogViewProps extends SelectedActivityDisplayProperties {
    loading?: boolean;
    ftp?: number;

    /**
     * Phase 2 (workout-mobile-hld-phase2.md §4.2) - "Add Workout" button + inline
     * "Workout: <name> [x]" row, net-new for this dialog. Gated on the dialog's existing
     * `canStart` (same prop that already disables "Ride Again" - a workout-only activity, no
     * route, gets neither element; see the session 3.3 note in
     * workout-mobile-session-plan-phase2.md).
     */
    attachedWorkout: AttachedWorkoutProps | null;

    onClose: () => void;
    onRideAgain: () => void;
    onShareFile: (path: string) => void;
    onUpload: (type: string) => void;
    onOpenUpload: (url: string) => void;
    onClearWorkout: () => void;
    onAddWorkout: () => void;
    compact?: boolean;
}

export interface ActivityDetailsDialogProps {
    onClose: () => void;
    onRideAgain: (route: any) => void;
}