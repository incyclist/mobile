import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, AppState } from 'react-native';
import {
    getWorkoutRidePageService,
    IObserver,
    RideType,
    WorkoutGraphActuals,
    WorkoutRidePageDisplayProps,
    WorkoutRidePageService,
} from 'incyclist-services';
import { useUnmountEffect, useWorkoutRideGestures } from '../../../hooks';
import { colors } from '../../../theme';
import { WorkoutRidePageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { goBack } from '../../../services';

interface WorkoutRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

const EMPTY_ACTUALS: WorkoutGraphActuals = { power: [], heartrate: [], position: 0 };

/**
 * Smart page for a workout-only ride (workout-mobile-hld.md §3.2/§5, session 5.6). Owns
 * `WorkoutRidePageService`'s lifecycle and app background/foreground handling — mirrors
 * `VideoRidePage`/`GPXTourPage` exactly, except this page's service is a dedicated sibling
 * service (`WorkoutRidePageService`, session 2.2), not the shared `RidePageService` those two
 * ride types use (workout-ride-page-service-design.md §7 #5 — explicit non-goal).
 *
 * One extra subscription vs. Video/GPX: `navigate-back`, emitted when the workout finishes,
 * is stopped, or the underlying ride reaches `Finished` on its own (design doc §5) — the UI
 * calls `navigation.goBack()` directly for that path. The RideMenu's own "End Ride" flow is
 * unchanged (pause + ActivitySummaryDialog review, then `onCloseRidePage` -> this page's
 * `onClose` prop -> the base `RidePageService.onEndRide()`, same as every other ride type).
 */
export const WorkoutRidePage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: WorkoutRidePageProps) => {
    const [displayProps, setDisplayProps] = useState<WorkoutRidePageDisplayProps | null>(null);

    const refService = useRef<WorkoutRidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const { gesture, feedback, loadIncrement } = useWorkoutRideGestures();

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps();
            setDisplayProps(update);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        const service = getWorkoutRidePageService();
        refService.current = service;

        // openPage returns the page observer
        refObserver.current = service.openPage(simulate);
        // ride observer is available after page is open
        refRideObserver.current = service.getRideObserver();

        if (refObserver.current) {
            refObserver.current.on('page-update', onUpdate);
            refObserver.current.on('ride-type-update', onRideTypeChange);
            refObserver.current.on('navigate-back', goBack);
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
            refObserver.current.off('navigate-back', goBack);
        }
        refService.current?.closePage();
        refInitialized.current = false;
    });

    const onMenuOpen = useCallback(() => refService.current?.onMenuOpen(), []);
    const onMenuClose = useCallback(() => refService.current?.onMenuClose(), []);
    const onRetryStart = useCallback(() => refService.current?.onRetryStart(), []);
    const onIgnoreStart = useCallback(() => refService.current?.onIgnoreStart(), []);
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
            />
        </ErrorBoundary>
    );
};
