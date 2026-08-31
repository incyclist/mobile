import React, { useCallback, useEffect, useMemo } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { VideoRidePageDisplayProps, useAvatars } from 'incyclist-services';
import {
    Video,
    RideDashboard,
    ElevationGraph,
    InfoText,
    StartRideDisplay,
    MainBackground,
    FreeMap,
    Dynamic,
    RideOverlay,
    RideGestureHintOverlay,
    RideSwipeFeedback,
} from '../../../components';
import { LatLng } from '../../../components/FreeMap/types';
import { ErrorBoundary } from '../../../components';
import { colors } from '../../../theme';
import { useScreenLayout  } from '../../../hooks';
import { RideViewActionProps } from '../types';
import { useRouteOnlyRideGeometry } from '../hooks/useRouteOnlyRideGeometry';
import { RideBottomBarAndMenu } from '../components/RideBottomBarAndMenu';
import { createSharedRideViewStyles } from './sharedRideViewStyles';
import { getGestureHintContent } from '../gestureHintContent';
import { buildPrevRiderMarkers, buildNearbyRiderMarkers } from '../prevRiderMarkers';
import { avatarToConfig } from '../../../components/PrevRides';

interface VideoRidePageViewProps extends RideViewActionProps {
    displayProps: VideoRidePageDisplayProps;
}

// Conditional import — same pattern as Workout/View.tsx / useRideGestures (session 5.4): keeps
// Storybook (Vite/web) and any environment without the native module from crashing. `gesture`
// (from useRideGestures) is already undefined on web/Storybook, so GestureDetector is simply
// never rendered there even when this fallback resolves to `View`.
let GestureDetector: any = View;
try {
    if (Platform.OS !== 'web') {
        ({ GestureDetector } = require('react-native-gesture-handler'));
    }
} catch {
    GestureDetector = View;
}

export const VideoRidePageView = (props: VideoRidePageViewProps) => {
    const {
        displayProps,
        rideObserver,
        gesture,
        feedback,
        loadIncrementPct,
        onMenuOpen,
        onMenuClose,
        onCloseRidePage,
        onRetryStart,
        onIgnoreStart,
        onCancelStart,
        getGraphActuals,
        onToggleCornerWidget,
        onStopWorkout,
        onGestureHintDismissed,
        onExpandPrevRides,
        onCollapsePrevRides,
        onSetPrevRidesVisibleRows,
        onSetPrevRidesMode,
        getPrevRidesRows,
    } = props;

    const { video, videos, route, startOverlayProps, menuProps, workoutAttached, graph, steps, dashboard, cornerWidget, loadButtonMode, gestureHint, prevRides, nearbyRiders } = displayProps;

    // Derived properties
    const routeData = route?.details;
    const lapMode = route?.description?.isLoop;
    const currentVideo = video ?? videos?.find(v => !v.hidden);
    const infoText = currentVideo?.info;

    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    // Additive branch, workout-mobile-hld-phase2.md §5 — route-only rides render through the
    // untouched path below, exactly as today. `workoutAttached` is the service-side attachment
    // gate (workout-combo-service-design.md §4.2).
    const comboActive = !!workoutAttached;

    // overlayActive generalizes comboActive's gate: the overlay now also renders for a plain
    // route ride with eligible previous rides or eligible nearby riders. When overlayActive is
    // false (no workout, no eligible previous rides, no eligible nearby riders — most rides, most
    // of the time), every branch below renders byte-for-byte as it did before this feature
    // existed.
    const prevRidesEligible = !!prevRides && prevRides.mode !== 'hidden';
    // Unlike prevRides, there is no 'hidden' mode — nearbyRiders is simply present-with-rows or
    // absent (nearby-riders-mobile-design.md §4/§5.3).
    const nearbyRidersEligible = !!nearbyRiders && nearbyRiders.rows.length > 0;
    const overlayActive = comboActive || prevRidesEligible || nearbyRidersEligible;

    // Both tiers default to the full list ('list') - phone's own PrevRidesCornerPanel now shows
    // it alongside elevation/workout rather than a condensed one-liner in place of them
    // (repo-owner review 2026-08-25), and its collapse/expand state is tracked independently via
    // its own local component state, not this mode - so this only needs to fire once on mount.
    useEffect(() => {
        onSetPrevRidesMode('list');
    }, [onSetPrevRidesMode]);

    // Previous riders' live positions for the corner map (Video has no main map). The current
    // rider's own marker is unaffected — see buildPrevRiderMarkers().
    const prevRiderMarkers = useMemo(() => buildPrevRiderMarkers(prevRides?.rows), [prevRides]);

    // Nearby (group-ride) riders' live positions — same page-update cadence as prevRiderMarkers
    // above, not <Dynamic>-scoped (design doc §5.4/§6.2). Merged with prevRiderMarkers below into
    // one array before being handed to FreeMap's generalized riderMarkers prop.
    const nearbyRiderMarkers = useMemo(() => buildNearbyRiderMarkers(nearbyRiders?.rows), [nearbyRiders]);
    const riderMarkers = useMemo(
        () => [...prevRiderMarkers, ...nearbyRiderMarkers],
        [prevRiderMarkers, nearbyRiderMarkers]
    );

    // The current rider's own avatar — matches the current-position marker (corner map, elevation
    // strips) to the "You" row shown in the Nearby Riders list. Resolved directly from
    // AvatarService (via useAvatars(), same as web-ui's MapRideView/MapOverlay) rather than derived
    // from prevRides.rows: that derivation used to fall back to undefined (default marker styling)
    // whenever prevRides had no eligible rows (e.g. a first-time route), even though a real avatar
    // was available and Nearby Riders' own "You" row resolved it independently via the same
    // AvatarService. AvatarService.get('current') self-populates and always resolves to a value.
    const currentAvatar = useMemo(() => avatarToConfig(useAvatars().get('current')), []);

    // Shared with Workout/View.tsx (getGestureHintContent()) - null when there's nothing useful
    // to teach (loadButtonMode==='hidden' with no workout attached, up/down has no effect at all).
    const gestureHintContent = useMemo(
        () => getGestureHintContent({ workoutAttached, loadButtonMode, loadIncrementPct }),
        [workoutAttached, loadButtonMode, loadIncrementPct]
    );

    // Same visibility condition the existing Map Overlay below already uses (unchanged) — reused
    // as the combo layout hook's `mapVisible` input (ride-overlay-layout-design.md §3.1).
    const mapVisible = !isCompact && !!route?.description?.hasGpx && !!routeData?.points?.length;

    // Route-only corner-widget placement (map + 2km elevation preview) — shared with
    // GPX/View.tsx (FIXES_BACKLOG.md item #63). Ports the combo overlay's analytic
    // fit-check/sizing instead of the old measured-width heuristic; see that hook for the full
    // rationale.
    const {
        dashboardHeight,
        dashboardItemCount,
        updateDashboardDimensions,
        onDashboardMetrics,
        dashboardDynamicStyle,
        elevationPreviewDynamicStyle,
        mapOverlayDynamicStyle,
        bottomBarStyle,
    } = useRouteOnlyRideGeometry({ isCompact, mapVisible });

    const transformPosition = useCallback((val: any): LatLng | undefined => {
        if (!val) return undefined;
        if (typeof val === 'number') return undefined; // position-update can emit number for other contexts
        const p = val?.position;
        return (p?.lat !== undefined && p?.lng !== undefined)
            ? { lat: p.lat, lng: p.lng }
            : undefined;
    }, []);

    // Extracted so the swipe-gesture surface (GestureDetector, below) can wrap it without
    // duplicating this whole subtree - same reasoning as Workout/View.tsx's identical `content`.
    // Stays mounted (just invisible-styled) during the start overlay, unlike GPX/Workout's
    // equivalent block, so gesture-wrapping must itself stay gated on !startOverlayProps below -
    // otherwise a swipe could register while the start overlay is still showing.
    const mainContent = (
            <View style={[StyleSheet.absoluteFill, startOverlayProps ? styles.invisible : undefined]}>
                {/* Video Layer */}
                {video && (
                    <Video
                        key={video.src}
                        width='100%'
                        height='100%'
                        {...video}
                    />
                )}
                {videos?.map(v => {
                    return (
                    <Video
                        key={v.src}
                        width='100%'
                        height='100%'
                        {...v}
                    />
                )})}

                {/* 2km Elevation Preview — route-only rendering, untouched. Replaced by
                    RideOverlay's own corner-widget rects whenever overlayActive (a workout is
                    attached, or eligible previous rides exist). */}
                {!overlayActive && (
                    <ElevationGraph
                        routeData={routeData}
                        observer={rideObserver ?? undefined}
                        range={2000}
                        lapMode={lapMode}
                        showLine={true}
                        showColors={true}
                        showXAxis={!isCompact}
                        showYAxis={!isCompact}
                        style={[
                            isCompact ? shared.elevationPreviewCompact : shared.elevationPreviewTablet,
                            elevationPreviewDynamicStyle,
                        ]}
                    />
                )}

                {/* Map Overlay — route-only rendering, untouched (HLD §9.1). See above. */}
                {!overlayActive && !isCompact && route?.description?.hasGpx && !!routeData?.points?.length && (
                    <View style={[styles.mapOverlay, mapOverlayDynamicStyle]}>
                        <ErrorBoundary>
                            <Dynamic
                                observer={rideObserver ?? undefined}
                                event='position-update'
                                prop='position'
                                transform={transformPosition}
                            >
                                <FreeMap
                                    points={routeData.points}
                                    draggable={false}
                                    followPosition={true}
                                    colorActive='blue'
                                    colorInactive='rgba(255,255,255,0.4)'
                                />
                            </Dynamic>
                        </ErrorBoundary>
                    </View>
                )}

                {/* Overlay (WorkoutDashboard when a workout is attached, previous-rides ear/corner
                    slot when eligible, or both) — additive, prop-driven branch. The
                    `!comboActive || (graph && steps && dashboard)` half preserves the existing
                    "don't mount the combo overlay before workout data is ready" defensiveness — a
                    route-only overlayActive ride never expects that data at all. */}
                {overlayActive && (!comboActive || (graph && steps && dashboard)) && (
                    <RideOverlay
                        itemCount={dashboardItemCount}
                        mapVisible={mapVisible}
                        measuredRideDashboardHeight={dashboardHeight}
                        graph={graph}
                        steps={steps}
                        dashboard={dashboard}
                        prevRides={prevRides?.rows}
                        cornerWidget={cornerWidget}
                        dashboardHeight={dashboardHeight}
                        compact={isCompact}
                        rideObserver={rideObserver}
                        getGraphActuals={getGraphActuals}
                        onToggleCornerWidget={onToggleCornerWidget}
                        routeData={routeData}
                        lapMode={lapMode}
                        mapPoints={routeData?.points}
                        transformPosition={transformPosition}
                        onStopWorkout={onStopWorkout}
                        onExpandPrevRides={onExpandPrevRides}
                        onCollapsePrevRides={onCollapsePrevRides}
                        onVisibleRowsChange={onSetPrevRidesVisibleRows}
                        getPrevRidesRows={getPrevRidesRows}
                        mapPrevRiders={riderMarkers}
                        currentAvatar={currentAvatar}
                        nearbyRiders={nearbyRiders?.rows}
                    />
                )}

                {infoText && <InfoText {...infoText} />}

                {/* Bottom bar: Menu button + Full route elevation, plus the Ride Menu it opens */}
                <RideBottomBarAndMenu
                    bottomBarStyle={bottomBarStyle}
                    menuButtonContainerStyle={shared.menuButtonContainer}
                    elevationFullStyle={shared.elevationFull}
                    routeData={routeData}
                    rideObserver={rideObserver}
                    lapMode={lapMode}
                    onMenuOpen={onMenuOpen}
                    menuProps={menuProps}
                    onMenuClose={onMenuClose}
                    onCloseRidePage={onCloseRidePage}
                    currentAvatar={currentAvatar}
                />
            </View>
    );

    return (
        <View style={styles.container}>
            {/* Everything below is rendered but made invisible during start overlay */}


            { !startOverlayProps && <View style={[StyleSheet.absoluteFill]}>
                <View style={[
                    shared.dashboardContainer,
                    isCompact ? shared.dashboardCompact : shared.dashboardTablet,
                    dashboardDynamicStyle
                ]}>
                    <View onLayout={updateDashboardDimensions}>
                        <RideDashboard layout='icon-left' onMetrics={onDashboardMetrics} />
                    </View>
                </View>
            </View>}

            {(!startOverlayProps && gesture) ? (
                <GestureDetector gesture={gesture}>
                    {mainContent}
                </GestureDetector>
            ) : mainContent}

            {!startOverlayProps && <RideSwipeFeedback visible={feedback.visible} message={feedback.message} />}

            {/* Sequenced strictly after StartRideDisplay clears, never alongside it - matches
                Workout/View.tsx. Visibility is entirely owned by RidePageService's gestureHint
                prop; this just renders what it's told (and gestureHintContent's mode gate). */}
            {!startOverlayProps && gestureHint?.visible && gestureHintContent && (
                <RideGestureHintOverlay
                    message={gestureHintContent.message}
                    legendIntro={gestureHintContent.legendIntro}
                    legend={gestureHintContent.legend}
                    compact={isCompact}
                    onDismiss={onGestureHintDismissed}
                />
            )}

            {/* Background shown during start overlay */}
            {startOverlayProps && <MainBackground />}

            {/* Start overlay — always on top, outside invisible wrapper */}
            {startOverlayProps && (
                <StartRideDisplay
                    {...startOverlayProps}
                    onStart={onIgnoreStart}
                    onRetry={onRetryStart}
                    onIgnore={onIgnoreStart}
                    onCancel={onCancelStart}
                />
            )}
        </View>
    );
};

// Style entries shared with Video/TestView.tsx (FIXES_BACKLOG.md item #63) live in
// sharedRideViewStyles; only what's actually specific to this view is declared below.
const shared = createSharedRideViewStyles('rgba(0,0,0,0.0)');

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
    invisible: {
        opacity: 0,
    },
    mapOverlay: {
        position: 'absolute',
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        overflow: 'hidden',
        zIndex: 10,
        elevation: 10,
    },
});