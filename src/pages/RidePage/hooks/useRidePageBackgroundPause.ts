import { useEffect } from 'react';
import { AppState } from 'react-native';
import { IRidePageService } from 'incyclist-services';
import { MutableRefObject } from 'react';

/**
 * Pauses/resumes the ride page service when the app goes to/returns from the background.
 * Extracted from `WorkoutRidePage`/`VideoRidePage`, which had identical copies (FIXES_BACKLOG.md
 * item #63). `GPXTourPage` does not currently call this - that omission is pre-existing and left
 * unchanged here rather than silently "fixed" as part of a duplication cleanup.
 */
export function useRidePageBackgroundPause(refService: MutableRefObject<IRidePageService | null>) {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            const service = refService.current;
            if (!service) return;

            if (nextAppState === 'background' || nextAppState === 'inactive') {
                service.pausePage();
            } else if (nextAppState === 'active') {
                service.resumePage();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [refService]);
}
