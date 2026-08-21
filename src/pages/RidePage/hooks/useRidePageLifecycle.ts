import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getRidePageService,
    IObserver,
    IRidePageService,
    RideType,
    WorkoutGraphActuals,
    AnyRidePageDisplayProps,
} from 'incyclist-services';
import { useUnmountEffect } from '../../../hooks';

const EMPTY_ACTUALS: WorkoutGraphActuals = { power: [], heartrate: [], position: 0 };

interface UseRidePageLifecycleParams {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
}

/**
 * Shared open/subscribe/close lifecycle for the ride-page shells (Workout, GPX, Video).
 * Extracted from near-identical boilerplate across `WorkoutRidePage`, `GPXTourPage` and
 * `VideoRidePage` (FIXES_BACKLOG.md item #63 - SonarCloud duplication). Each page still owns
 * whatever else is specific to it (e.g. `WorkoutRidePage`'s gesture hooks and
 * `onGestureHintDismissed`, `GPXTourPage`/`VideoRidePage`'s `onToggleCornerWidget`/
 * `onStopWorkout`, and the AppState background/foreground handling that only Workout and
 * Video currently subscribe to) - this hook is deliberately limited to the identical part.
 */
export function useRidePageLifecycle<T extends AnyRidePageDisplayProps>({
    simulate = false,
    onRideTypeChange,
}: UseRidePageLifecycleParams) {
    const [displayProps, setDisplayProps] = useState<T | null>(null);

    const refService = useRef<IRidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps() as T;
            setDisplayProps(update);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        const service = getRidePageService();
        refService.current = service;

        // openPage returns the page observer
        refObserver.current = service.openPage(simulate);
        // ride observer is available after page is open
        refRideObserver.current = service.getRideObserver();

        if (refObserver.current) {
            refObserver.current.on('page-update', onUpdate);
            refObserver.current.on('ride-type-update', onRideTypeChange);
        }

        onUpdate();
    }, [simulate, onUpdate, onRideTypeChange]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('page-update', onUpdate);
            refObserver.current.off('ride-type-update', onRideTypeChange);
        }
        refService.current?.closePage();
        refInitialized.current = false;
    });

    const onMenuOpen = useCallback(() => refService.current?.onMenuOpen(), []);
    const onMenuClose = useCallback(() => refService.current?.onMenuClose(), []);
    const onRetryStart = useCallback(() => refService.current?.onRetryStart(), []);
    const onIgnoreStart = useCallback(() => refService.current?.onIgnoreStart(), []);
    const getGraphActuals = useCallback(() => refService.current?.getGraphActuals() ?? EMPTY_ACTUALS, []);

    return {
        displayProps,
        refService,
        refRideObserver,
        onMenuOpen,
        onMenuClose,
        onRetryStart,
        onIgnoreStart,
        getGraphActuals,
    };
}
