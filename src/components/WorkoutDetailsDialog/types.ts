import { WorkoutGraphPlan } from 'incyclist-services';

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

    groups: string[];
    group: string;
    isScheduled: boolean;
    scheduledLabel?: string;

    canDelete: boolean;
    canStartWorkoutOnly: boolean;

    showDeleteConfirm: boolean;
    deleting: boolean;

    onClose: () => void;
    onSetFtp: (ftp: number) => void;
    onSetErgMode: (enabled: boolean) => void;
    onChangeGroup: (group: string) => void;
    onStart: () => void;
    onDeleteRequest: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
}
