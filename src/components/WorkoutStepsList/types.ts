import type { StyleProp, ViewStyle } from 'react-native';
import type { WorkoutUpcomingSteps } from 'incyclist-services';

export type { WorkoutStepDisplay, WorkoutUpcomingSteps } from 'incyclist-services';

export interface WorkoutStepsListProps {
    steps: WorkoutUpcomingSteps;
    /** Matches useScreenLayout()==='compact' — tightens spacing/type and shows fewer upcoming rows. */
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
}
