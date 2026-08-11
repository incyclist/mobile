import type { StyleProp, ViewStyle } from 'react-native';
import type { WorkoutUpcomingSteps } from 'incyclist-services';

export type { WorkoutStepDisplay, WorkoutUpcomingSteps } from 'incyclist-services';

export interface WorkoutStepsListProps {
    steps: WorkoutUpcomingSteps;
    /** Matches useScreenLayout()==='compact' — tightens spacing/type and shows fewer upcoming rows. */
    compact?: boolean;
    /** The "⋯ more steps ahead" / "Last step" row. Default true (unchanged for existing callers) — WorkoutDashboard (session 3.1) opts out to stay within its tighter row budget. */
    showEndHint?: boolean;
    style?: StyleProp<ViewStyle>;
}
