import { AttachedRouteProps, WorkoutGraphPlan } from 'incyclist-services';

export interface WorkoutDetailsDialogProps {
    workoutId: string;
}

/**
 * Pure view props. `workout: Workout` (from `WorkoutDetailsProps`) is replaced
 * by a ready-made `plan: WorkoutGraphPlan` — the smart `WorkoutDetailsDialog`
 * builds it via `getWorkoutGraphSeries()` (absolute Watts, resolved against
 * the effective `ftp`), same convention as `WorkoutItemDisplayProps.plan` /
 * `WorkoutsTable`'s `buildPlan()`. `date`/`isScheduled` come through as-is;
 * `scheduledLabel` is the pre-formatted display string (the pure View must
 * never import `incyclist-services` — mobile `react-native.md` rule 7).
 */
export interface WorkoutDetailsViewProps {
    id: string;
    title: string;
    description?: string;
    duration: string;
    plan: WorkoutGraphPlan;
    compact: boolean;

    ftp: number;
    useErgMode: boolean;

    /**
     * Workout Step Change Audio Signal feature - read/written directly via useUserSettings() in the
     * smart WorkoutDetailsDialog (not proxied through a page-service display-prop/onSet* pattern
     * like useErgMode above, since this setting doesn't need live reactive propagation - see
     * useRideGestures.ts for the same direct-settings precedent). Shared key with
     * WorkoutSettingsDialog's in-ride toggle.
     */
    stepChangeAudioSignal: boolean;

    groups: string[];
    group: string;
    isScheduled: boolean;
    scheduledLabel?: string;

    canDelete: boolean;
    /** True when a route is currently attached - a combo Start is available (mirrors desktop's
     *  WorkoutDetails `canStart`, mutually exclusive with canStartWorkoutOnly below). */
    canStart: boolean;
    canStartWorkoutOnly: boolean;

    showDeleteConfirm: boolean;
    deleting: boolean;

    /**
     * Phase 2 (workout-mobile-hld-phase2.md §4.2) - the "Route: <name> [x]" row and "Add Route"
     * button, shown whenever nothing/something is attached respectively.
     */
    attachedRoute: AttachedRouteProps | null;

    onClose: () => void;
    onSetFtp: (ftp: number) => void;
    onSetErgMode: (enabled: boolean) => void;
    onSetStepChangeAudioSignal: (enabled: boolean) => void;
    onChangeGroup: (group: string) => void;
    onStart: () => void;
    onDeleteRequest: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
    onClearRoute: () => void;
    onAddRoute: () => void;
}
