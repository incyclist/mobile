import React, { useCallback } from 'react';
import { View } from 'react-native';
import { GPXRidePageDisplayProps, RideType } from 'incyclist-services';
import { colors } from '../../../theme';
import { GPXTourPageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { useRidePageLifecycle } from '../hooks/useRidePageLifecycle';
import { useRideGestures } from '../../../hooks';

interface GPXTourPageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

export const GPXTourPage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: GPXTourPageProps) => {
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
    } = useRidePageLifecycle<GPXRidePageDisplayProps>({ simulate, onRideTypeChange });

    const onToggleCornerWidget = useCallback(() => refService.current?.onToggleCornerWidget(), [refService]);
    // "Stop Workout, keep riding" — see VideoRidePage.tsx's identical comment for the full rationale.
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
        );
    }

    return (
        <ErrorBoundary>
            <GPXTourPageView
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