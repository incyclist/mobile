import React, { useCallback } from 'react';
import { View } from 'react-native';
import { VideoRidePageDisplayProps, RideType } from 'incyclist-services';
import { colors } from '../../../theme';
import { VideoRidePageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { useRidePageLifecycle } from '../hooks/useRidePageLifecycle';
import { useRidePageBackgroundPause } from '../hooks/useRidePageBackgroundPause';
import { useRideGestures } from '../../../hooks';

interface VideoRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

export const VideoRidePage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: VideoRidePageProps) => {
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
    } = useRidePageLifecycle<VideoRidePageDisplayProps>({ simulate, onRideTypeChange });

    useRidePageBackgroundPause(refService);

    const onToggleCornerWidget = useCallback(() => refService.current?.onToggleCornerWidget(), [refService]);
    // "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3).
    // RidePageService.onStopWorkout() (incyclist-services #519) — depends on that PR being merged
    // and released; do not build/release this PR before then.
    const onStopWorkout = useCallback(() => refService.current?.onStopWorkout(), [refService]);
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
        )
    }

    return (
        <ErrorBoundary>
            <VideoRidePageView
                displayProps={displayProps}
                rideObserver={refRideObserver.current}
                gesture={gesture}
                feedback={feedback}
                loadIncrementPct={loadIncrement}
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                onCloseRidePage={onClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
                getGraphActuals={getGraphActuals}
                onToggleCornerWidget={onToggleCornerWidget}
                onStopWorkout={onStopWorkout}
                onGestureHintDismissed={onGestureHintDismissed}
            />
        </ErrorBoundary>
    );
};