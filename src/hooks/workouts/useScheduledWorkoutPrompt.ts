import { useCallback, useEffect, useRef, useState } from 'react';
import { ScheduledWorkout, useAppState, useWorkoutCalendar } from 'incyclist-services';
import { navigate } from '../../services';
import { useLogging } from '../logging';

// Once-per-app-session guard (workout-list-page-service-design.md §11.2). Deliberately kept in
// AppStateService's in-memory `state` (not `getPersistedState`/settings) - it must reset on every
// app launch, never survive to the next day, per the design's "no per-day persistence in Phase 1."
const SCHEDULED_PROMPT_GUARD_KEY = 'scheduledPromptShown';

export interface ScheduledWorkoutPromptState {
    /** Workout name, for "You have <title> scheduled today - do you want to start it?" */
    title: string;
}

export interface UseScheduledWorkoutPromptResult {
    /** `null` means: nothing to show right now. */
    prompt: ScheduledWorkoutPromptState | null;
    onYes: () => void;
    onNo: () => void;
    onCheckWorkouts: () => void;
}

/**
 * Cross-cutting mobile-UI mechanism (workout-mobile-hld.md §3.1/§5,
 * workout-list-page-service-design.md §11) - NOT owned by the Workouts feature. Meant to be
 * called from every content page except `devices`/pairing (`routes`, `activities`, `workouts`,
 * `search`, `main`).
 *
 * On first check per app session, if `WorkoutCalendarService.getScheduledToday()` returns a
 * workout and the once-per-session guard hasn't fired yet, this surfaces a prompt: Yes navigates
 * to the Workouts page with an auto-open param (consumed by `WorkoutsPage`'s
 * `autoOpenDetailsId` -> `WorkoutDetailsDialog`), No just dismisses, Check workouts navigates to
 * the Workouts page. `scheduledToday` is populated asynchronously by preload, so this also
 * subscribes to the calendar service's `'scheduled'` event to catch it arriving after mount, not
 * just what's already known at the moment this hook first runs.
 *
 * @param enabled Defaults to `true`. Pass `false` from a host that renders more than one
 * navigation route (e.g. `NotImplementedPage` doubles as both `main`, which should trigger this,
 * and `user`, which shouldn't) - keeps the hook call itself unconditional (Rules of Hooks) while
 * suppressing its side effects (calendar check, guard, navigation) for the excluded route.
 */
export const useScheduledWorkoutPrompt = (enabled: boolean = true): UseScheduledWorkoutPromptResult => {
    const appState = useAppState();
    const calendar = useWorkoutCalendar();
    const { logEvent } = useLogging('ScheduledWorkoutPrompt');

    const [prompt, setPrompt] = useState<ScheduledWorkoutPromptState | null>(null);

    // Holds the id actually needed to re-open the details dialog. Deliberately NOT
    // `scheduled.id` (WorkoutCalendarService.getScheduledWorkout()'s composite `source:workoutId`
    // string) - `WorkoutListPageService.findWorkoutCard()`/`WorkoutCard.getId()` key cards by the
    // plain `Workout.id` (same field `getUpcomingTrainingProps()`'s "Upcoming Training" rows
    // already use for their own onOpenDetails calls). Passing the composite id through would
    // silently fail the card lookup and leave `WorkoutDetailsDialog` unable to load anything.
    const refWorkoutId = useRef<string | null>(null);

    const checkAndShow = useCallback(() => {
        if (!enabled) return;
        if (appState.getState(SCHEDULED_PROMPT_GUARD_KEY)) return;

        const scheduled: ScheduledWorkout | undefined = calendar.getScheduledToday();
        if (!scheduled) return;

        const workoutId = scheduled.workout?.id ?? scheduled.workoutId;
        if (!workoutId) return;

        refWorkoutId.current = workoutId;
        // Set the guard the moment the prompt is triggered, not on a later per-action basis -
        // matches workout-list-page-service-design.md §11.2 ("it triggers the popup and sets the
        // guard") and is simpler/safer than three separate call sites all needing to remember it.
        appState.setState(SCHEDULED_PROMPT_GUARD_KEY, true);
        setPrompt({ title: scheduled.name });
        logEvent({ message: 'scheduled workout prompt shown', workoutId });
    }, [enabled, appState, calendar, logEvent]);

    useEffect(() => {
        if (!enabled) return;

        checkAndShow();

        calendar.on('scheduled', checkAndShow);
        return () => {
            calendar.off('scheduled', checkAndShow);
        };
    }, [enabled, calendar, checkAndShow]);

    const onYes = useCallback(() => {
        setPrompt(null);
        const workoutId = refWorkoutId.current;
        navigate('workouts', workoutId ? { autoOpenDetailsId: workoutId } : undefined);
    }, []);

    const onNo = useCallback(() => {
        setPrompt(null);
    }, []);

    const onCheckWorkouts = useCallback(() => {
        setPrompt(null);
        navigate('workouts');
    }, []);

    return { prompt, onYes, onNo, onCheckWorkouts };
};
