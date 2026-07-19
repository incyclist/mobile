import { WorkoutListItemProps } from 'incyclist-services';
import { WorkoutGraphPlan } from '../WorkoutGraph';

/**
 * `WorkoutListItemProps.workout: Workout` is replaced here by a ready-made
 * `plan: WorkoutGraphPlan` — the `Workout` -> `WorkoutGraphPlan` conversion
 * (`getWorkoutGraphSeries()`) is owned by `services` and not implemented yet
 * (session 2.2, in progress). `WorkoutGraphPlan` itself is the local type
 * defined in `WorkoutGraph/types.ts` for the same reason (see that file's
 * header comment) — once the real generator lands in `services`, the page
 * service will hand this component a `plan` built that way; this component's
 * contract does not change.
 */
export interface WorkoutItemDisplayProps extends Omit<WorkoutListItemProps, 'workout'> {
    plan: WorkoutGraphPlan;
    outsideFold?: boolean;
    /**
     * Not part of `WorkoutListItemProps` (the flat, imported-workout list) —
     * carried over from `ScheduledWorkoutItemProps` (same design doc §4) so
     * this same row can also render the "Upcoming Training" section's
     * synced/scheduled entries once `WorkoutsTable` is built (session 5.1).
     * `date` = the scheduled day; `isToday` = the informational highlight
     * (never ride-selection — see HLD §5 on the isToday/selected split).
     */
    date?: Date;
    isToday?: boolean;
}

export interface WorkoutItemViewProps extends Omit<WorkoutItemDisplayProps, 'date'> {
    /**
     * Pre-formatted, like `duration` — "Today" when `isToday`, otherwise a
     * plain date. Computed by the smart `WorkoutItem` from `date`/`isToday`
     * via `incyclist-services`' `formatDateTime`; the pure View never imports
     * services (mobile `CLAUDE.md` rule 7 — smart/view split).
     */
    scheduledLabel?: string | null;
    onOpenDetails: (id: string) => void;
    onDelete: (id: string) => void;
}
