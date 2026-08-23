import { IObserver, WorkoutGraphActuals } from 'incyclist-services';
import type { RideGestureFeedback } from '../../hooks';

/**
 * Action/handler props shared by the ride-page view components (`GPX/View.tsx`,
 * `Video/View.tsx`). Each view adds its own `displayProps` (typed per ride type) plus whatever
 * else is specific to it on top. Extracted to remove a near-identical prop-interface duplicate
 * flagged by SonarCloud (FIXES_BACKLOG.md item #63).
 */
export interface RideViewActionProps {
    rideObserver: IObserver | null;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onCloseRidePage: () => void;
    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
    /** Only actually called when a workout is attached (workout-mobile-hld-phase2.md §5) —
     *  unused, harmless, otherwise. */
    getGraphActuals: () => WorkoutGraphActuals;
    onToggleCornerWidget: () => void;
    /** "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3). */
    onStopWorkout: () => void;
    /** From useRideGestures() — undefined on web/Storybook, where GestureDetector must not be used. */
    gesture: any;
    feedback: RideGestureFeedback;
    /** Live `preferences.workouts.loadIncrement` setting — shown in the gesture-hint overlay's legend. */
    loadIncrementPct: number;
    onGestureHintDismissed: (props: { dontShowAgain: boolean }) => void;
}
