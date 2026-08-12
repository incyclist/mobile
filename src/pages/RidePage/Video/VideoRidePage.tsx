import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, AppState } from 'react-native';
import {
    getRidePageService,
    IObserver,
    VideoRidePageDisplayProps,
    IRidePageService,
    RideType,
    WorkoutGraphActuals,
    useAppState,
    useRideDisplay,
} from 'incyclist-services';
import { useUnmountEffect } from '../../../hooks';
import { colors } from '../../../theme';
import { VideoRidePageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';

interface VideoRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose:()=>void,
}

const EMPTY_ACTUALS: WorkoutGraphActuals = { power: [], heartrate: [], position: 0 };

export const VideoRidePage = ({ simulate = false, onRideTypeChange, onCancelStart,onClose }: VideoRidePageProps) => {
    const [displayProps, setDisplayProps] = useState<VideoRidePageDisplayProps | null>(null);

    const refService = useRef<IRidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps() as VideoRidePageDisplayProps
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
            refObserver.current.on('ride-type-update',onRideTypeChange)
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
            // Matches GPXTourPage/WorkoutRidePage's own cleanup (previously missing here — a real
            // gap: the page observer persists across a mid-ride ride-type transition
            // (workout-combo-service-design.md §4.5.1's openPage() returns the SAME observer
            // rather than creating a new one), so leaving this attached would leak a second
            // 'ride-type-update' listener onto it once the next page mounts and subscribes too.
            refObserver.current.off('ride-type-update', onRideTypeChange);
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
    const onToggleCornerWidget = useCallback(() => refService.current?.onToggleCornerWidget(), []);
    // "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3). No
    // RidePageService passthrough exists for this yet (unlike onPause/onStepBack/etc.), so this
    // calls the lower-level RideDisplayService's own public stopWorkout() directly — see this
    // session's report for why a page-service wrapper wasn't added in this mobile-only session.
    // useRideDisplay() (like getRidePageService()) resolves to a singleton, so it's safe to call
    // from inside an event handler, not just at render time.
    const onStopWorkout = useCallback(() => useRideDisplay().stopWorkout(), []);
    const comboEnabled = useAppState().hasFeature('MOBILE_WORKOUT_ROUTE_COMBO');

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
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                onCloseRidePage={onClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
                getGraphActuals={getGraphActuals}
                onToggleCornerWidget={onToggleCornerWidget}
                comboEnabled={comboEnabled}
                onStopWorkout={onStopWorkout}
            />
        </ErrorBoundary>
    );
};