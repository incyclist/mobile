import type { StyleProp, ViewStyle } from 'react-native';
import type { WorkoutGraphPlan, WorkoutGraphActuals, WorkoutUpcomingSteps } from 'incyclist-services';
import type { WorkoutGraphMode } from '../WorkoutGraph';

export type { WorkoutGraphPlan, WorkoutGraphActuals, WorkoutUpcomingSteps } from 'incyclist-services';

/**
 * Pure, informational-only overlay widget for the combined route+workout ride screen
 * (workout-mobile-hld-phase2.md §5.3/§6.2) — sits below `RideDashboard` and shows the
 * attached workout's description, its graph, and the upcoming-steps summary. No step/load
 * controls: swipe already covers that (§6.1), so this component takes no callbacks at all.
 *
 * The exact graph rendering size/mode is an explicit open question deferred to the Wave 4
 * prototype session (§8, open question 4) — `graphHeight`/`graphMode` are exposed here so
 * that session can experiment without touching this component's own logic. `graphHeight`
 * is forwarded to `WorkoutGraph`'s own `height` prop (its width is always measured by the
 * embedded `WorkoutGraph`'s onLayout, same convention as `WorkoutDetailsView`'s GraphColumn).
 */
export interface WorkoutDashboardProps {
    /** Workout name/title, e.g. "VO2 Max Intervals". */
    title: string;
    /** Optional free-text workout description (same field as `WorkoutDetailsViewProps.description`). */
    description?: string;
    graph: WorkoutGraphPlan;
    /** Live ride-observer overlay (recorded Power/HR + position marker) — optional, forwarded as-is to WorkoutGraph. */
    actuals?: WorkoutGraphActuals | null;
    steps: WorkoutUpcomingSteps;
    /** Forwarded to the embedded WorkoutGraph's `height` prop. Default: 120 (compact), 160 (normal). */
    graphHeight?: number;
    /** Forwarded to the embedded WorkoutGraph's `mode` prop. Default: 'live'. */
    graphMode?: WorkoutGraphMode;
    /** Matches useScreenLayout()==='compact' — tightens spacing/type, same convention as WorkoutStepsList. */
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
}
