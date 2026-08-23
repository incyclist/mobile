import React, { useCallback } from 'react';
import { View } from 'react-native';
import { RideType, WorkoutRidePageDisplayProps } from 'incyclist-services';
import { useRideGestures } from '../../../hooks';
import { colors } from '../../../theme';
import { WorkoutRidePageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { useRidePageLifecycle } from '../hooks/useRidePageLifecycle';
import { useRidePageBackgroundPause } from '../hooks/useRidePageBackgroundPause';

interface WorkoutRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

/**
 * Smart page for a workout-only ride (workout-mobile-hld.md §3.2/§5, session 5.6). Owns the
 * workout ride page service's lifecycle and app background/foreground handling — mirrors
 * `VideoRidePage`/`GPXTourPage` exactly, including the single `getRidePageService()` factory
 * (FIXES_BACKLOG #24): `RidePageService` is one ride-type-agnostic class handling Workout/GPX/Video
 * alike, not a per-ride-type subclass, so this page no longer needs a dedicated getter.
 *
 * No `navigate-back` subscription anymore (FIXES_BACKLOG #24, bug 2/2) - the ride-observer
 * 'Finished' path now converges onto `menuProps.finished`, same as every other completion path;
 * the RideMenu already renders the Activity Summary overlay off that, same as Video/GPX.
 */
export const WorkoutRidePage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: WorkoutRidePageProps) => {
    const { gesture, feedback, loadIncrement } = useRideGestures();

    const {
        displayProps,
        refService,
        refRideObserver,
        onMenuOpen,
        onMenuClose,
        onRetryStart,
        onIgnoreStart,
        getGraphActuals,
    } = useRidePageLifecycle<WorkoutRidePageDisplayProps>({ simulate, onRideTypeChange });

    useRidePageBackgroundPause(refService);

    const onGestureHintDismissed = useCallback(
        (dismissProps: { dontShowAgain: boolean }) => refService.current?.onGestureHintDismissed(dismissProps),
        [refService]
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
