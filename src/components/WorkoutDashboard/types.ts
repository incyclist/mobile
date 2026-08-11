import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { WorkoutGraphPlan, WorkoutGraphActuals, WorkoutUpcomingSteps, WorkoutDashboardLine } from 'incyclist-services';
import type { WorkoutGraphMode } from '../WorkoutGraph';

export type { WorkoutGraphPlan, WorkoutGraphActuals, WorkoutUpcomingSteps, WorkoutDashboardLine } from 'incyclist-services';

/**
 * Pure, informational overlay widget for the combined route+workout ride screen
 * (workout-mobile-hld-phase2.md §5.3/§6.2) — Video/GPX pages only. The dedicated Workout
 * ride page (`WorkoutRidePageView`) is untouched by this component; there the workout IS
 * the ride and a full-screen graph is appropriate. Here the route is the primary focus and
 * this is auxiliary info checked "from time to time" (repo-owner review, 2026-08-11), so the
 * whole widget is a compact bar — not much taller than `RideDashboard` itself.
 *
 * Two rows: a text bar carrying the exact same composed sentence `RideDashboard`'s own
 * workout shoutout line renders (`line`, straight from `RidePageDisplayProps.dashboard`), and
 * a row of three columns — workout graph (shape of the whole workout), upcoming-steps list
 * (current task + what's next), and a reserved `controls` slot (e.g. a future Stop-Workout
 * control — session 5.3; deliberately unopinionated here since 4.1 hasn't chosen button vs.
 * long-press yet, §8 open question).
 *
 * `graphHeight`/`graphMode` stay open for Wave 4 tuning, same as before, but now default to a
 * compact `strip` rendering instead of the full `live` mode — there isn't room for axes here,
 * and `WorkoutStepsList`'s current-row already carries its own progress marker, so a second
 * live position marker on the graph would be redundant in this cramped a space.
 */
export interface WorkoutDashboardProps {
    line: WorkoutDashboardLine;
    graph: WorkoutGraphPlan;
    /** Forwarded to WorkoutGraph as-is. Only visible when `graphMode='live'` — ignored by the default `strip` mode. */
    actuals?: WorkoutGraphActuals | null;
    steps: WorkoutUpcomingSteps;
    /** Reserved third column — renders nothing until a caller supplies content. */
    controls?: ReactNode;
    /** Forwarded to the embedded WorkoutGraph's `height` prop. Default: 44 (compact), 56 (normal). */
    graphHeight?: number;
    /** Forwarded to the embedded WorkoutGraph's `mode` prop. Default: 'strip'. */
    graphMode?: WorkoutGraphMode;
    /** Matches useScreenLayout()==='compact' — tightens spacing/type, same convention as WorkoutStepsList. */
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
}
