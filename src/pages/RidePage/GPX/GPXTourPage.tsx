import React, { useCallback } from 'react';
import { View } from 'react-native';
import { GPXRidePageDisplayProps, RideType } from 'incyclist-services';
import { colors } from '../../../theme';
import { GPXTourPageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { useRidePageLifecycle } from '../hooks/useRidePageLifecycle';

interface GPXTourPageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

export const GPXTourPage = ({ simulate = false, onRideTypeChange, onCancelStart, onClose }: GPXTourPageProps) => {
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
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                onCloseRidePage={onClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
                getGraphActuals={getGraphActuals}
                onToggleCornerWidget={onToggleCornerWidget}
                onStopWorkout={onStopWorkout}
            />
        </ErrorBoundary>
    );
};