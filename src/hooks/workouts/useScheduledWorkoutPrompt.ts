import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScheduledWorkoutPromptPageService, ScheduledWorkoutPromptDisplayProps } from 'incyclist-services';
import { navigate } from '../../services';

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
 * Cross-cutting mobile-UI mechanism - NOT owned by the Workouts feature. Meant to be called from
 * every content page except `devices`/pairing (`routes`, `activities`, `workouts`, `search`, `main`).
 *
 * Thin wrapper around the scheduled-workout prompt page service, which decides whether a prompt is
 * due (including the once-per-session guard). This hook only holds the visible prompt, re-checks
 * when the service relays `'scheduled'` (calendar data arrives asynchronously) and performs the
 * navigation intents: Yes opens the Workouts page with an auto-open param, Check workouts opens
 * the Workouts page, No just dismisses.
 *
 * @param enabled Defaults to `true`. Pass `false` from a host that renders more than one
 * navigation route (e.g. `NotImplementedPage` doubles as both `main`, which should trigger this,
 * and `user`, which shouldn't) - keeps the hook call itself unconditional (Rules of Hooks) while
 * suppressing its side effects (service call, subscription, navigation) for the excluded route.
 */
export const useScheduledWorkoutPrompt = (enabled: boolean = true): UseScheduledWorkoutPromptResult => {
    const [promptProps, setPromptProps] = useState<ScheduledWorkoutPromptDisplayProps | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const service = getScheduledWorkoutPromptPageService();
        const checkAndShow = () => {
            const props = service.show();
            if (props) setPromptProps(props);
        };

        checkAndShow();

        service.on('scheduled', checkAndShow);
        return () => {
            service.off('scheduled', checkAndShow);
        };
    }, [enabled]);

    const onYes = useCallback(() => {
        if (!promptProps) return;
        const nav = getScheduledWorkoutPromptPageService().onYes(promptProps);
        setPromptProps(null);
        navigate(nav.page, nav.autoOpenDetailsId ? { autoOpenDetailsId: nav.autoOpenDetailsId } : undefined);
    }, [promptProps]);

    const onNo = useCallback(() => {
        if (promptProps) getScheduledWorkoutPromptPageService().onNo(promptProps);
        setPromptProps(null);
    }, [promptProps]);

    const onCheckWorkouts = useCallback(() => {
        const nav = promptProps ? getScheduledWorkoutPromptPageService().onCheckWorkouts(promptProps) : { page: 'workouts' as const };
        setPromptProps(null);
        navigate(nav.page);
    }, [promptProps]);

    const prompt = useMemo(() => (promptProps ? { title: promptProps.title } : null), [promptProps]);

    return { prompt, onYes, onNo, onCheckWorkouts };
};
