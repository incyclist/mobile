import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, AppState } from 'react-native';
import {
    getRidePageService,
    IObserver,
    IRidePageService,
    RideType,
    WorkoutGraphActuals,
    WorkoutRidePageDisplayProps,
} from 'incyclist-services';
import { useUnmountEffect, useWorkoutRideGestures } from '../../../hooks';
import { colors } from '../../../theme';
import { WorkoutRidePageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';

interface WorkoutRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

const EMPTY_ACTUALS: WorkoutGraphActuals = { power: [], heartrate: [], position: 0 };

/**
 * Smart page for a workout-only ride (workout-mobile-hld.md §3.2/§5, session 5.6). Owns the
 * workout ride page service's lifecycle and app background/foreground handling — mirrors
 * `VideoRidePage`/`GPXTourPage` exactly, including the single `getRidePageService()` factory
 * (FIXES_BACKLOG #24): it resolves to the concrete `WorkoutRidePageService` on its own (keyed off
 * the currently selected ride's type), so this page no longer needs a dedicated getter.
 *
 * No `navigate-back` subscription anymore (FIXES_BACKLOG #24, bug 2/2) - the ride-observer
 * 'Finished' path now converges onto `menuProps.finished`, same as every other completion path;
 * the RideMenu already renders the Activity Summary overlay off that, same as Video/GPX.
 */
export const WorkoutRidePage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: WorkoutRidePageProps) => {
    const [displayProps, setDisplayProps] = useState<WorkoutRidePageDisplayProps | null>(null);

    const refService = useRef<IRidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const { gesture, feedback, loadIncrement } = useWorkoutRideGestures();

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            // This page only ever mounts for a Workout ride (RidePage.tsx's rideType dispatch) -
            // getPageDisplayProps() is typed AnyRidePageDisplayProps at the IRidePageService level
            // since the same call also serves Video/GPX, but it is always the Workout-shaped
            // WorkoutRidePageDisplayProps here.
            const update = service.getPageDisplayProps() as WorkoutRidePageDisplayProps;
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
    }, []);

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
    const onGestureHintDismissed = useCallback(
        (dismissProps: { dontShowAgain: boolean }) => refService.current?.onGestureHintDismissed(dismissProps),
        []
    );
    const getGraphActuals = useCallback(
        () => refService.current?.getGraphActuals() ?? EMPTY_ACTUALS,
        []
    );

    const styleEmpty = { flex: 1, backgroundColor: colors.background };
    if (!displayProps) {
        return (
            <View style={styleEmpty}>
                <MainBackground />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <WorkoutRidePageView
                displayProps={displayProps}
                rideObserver={refRideObserver.current}
                gesture={gesture}
                feedback={feedback}
                loadIncrementPct={loadIncrement}
                getGraphActuals={getGraphActuals}
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                onCloseRidePage={onClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
                onGestureHintDismissed={onGestureHintDismissed}
            />
        </ErrorBoundary>
    );
};
