import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import {
    RoutePoint,
    GPXRidePageDisplayProps,
} from 'incyclist-services';
import {
    RideDashboard,
    ElevationGraph,
    StartRideDisplay,
    MainBackground,
    FreeMap,
    Dynamic,
    RideOverlay,
    RideGestureHintOverlay,
    RideSwipeFeedback,
} from '../../../components';
import { LatLng } from '../../../components/FreeMap/types';
import { colors, textSizes } from '../../../theme';
import { useScreenLayout } from '../../../hooks';
import { StreetView } from '../../../components/StreetView';
import { IPosition } from '../../../components/StreetView/types';
import { RideViewActionProps } from '../types';
import { useRouteOnlyRideGeometry } from '../hooks/useRouteOnlyRideGeometry';
import { RideBottomBarAndMenu } from '../components/RideBottomBarAndMenu';
import { getGestureHintContent } from '../gestureHintContent';
import { buildPrevRiderMarkers, buildNearbyRiderMarkers } from '../prevRiderMarkers';
import { avatarToConfig } from '../../../components/PrevRides';

export interface GPXTourPageViewProps extends RideViewActionProps {
    displayProps: GPXRidePageDisplayProps;
}

const SV = React.memo(StreetView
//    ,(prev,next)=>prev.position?.lat!==next.position?.lat || prev.position?.lng!==next.position?.lng || prev.position?.heading!==next.position?.heading
)

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

export const GPXTourPageView = (props: GPXTourPageViewProps) => {
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

    const { startOverlayProps,menuProps,rideView,route,displayObserver,displayPosition,onDisplayEvent,workoutAttached,graph,steps,dashboard,cornerWidget,loadButtonMode,gestureHint,prevRides,nearbyRiders} = displayProps??{};

    // Derived properties
    const routeData = route?.details;
    const lapMode = route?.description?.isLoop;
    const hasGpx = route?.description?.hasGpx;

    // Whether the full-screen main view already shows a map, making the corner orientation map
    // redundant. Deliberately not `rideView !== 'map'`: GPX also renders 'sat' through FreeMap as a
    // full-screen map today ("currently also draw sv and sat as map - to be replaced later"), so that
    // predicate would double-render a map on top of a map. Update to
    // `rideView === 'sv' || rideView === 'sat'` once SatelliteView is a real, distinct view.
    const mainViewIsNotAMap = rideView === 'sv';

    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    // Additive branch, workout-mobile-hld-phase2.md §5 — see Video/View.tsx's identical comment.
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

    // Previous riders' live positions, for whichever map instance is actually on screen (corner
    // map via RideOverlay, or the main map below). The current rider's own marker is unaffected —
    // see buildPrevRiderMarkers().
    const prevRiderMarkers = useMemo(() => buildPrevRiderMarkers(prevRides?.rows), [prevRides]);

    // Nearby (group-ride) riders' live positions — same page-update cadence as prevRiderMarkers
    // above, not <Dynamic>-scoped (design doc §5.4/§6.2). Merged with prevRiderMarkers below into
    // one array before being handed to FreeMap's generalized riderMarkers prop, at both sites that
    // already carry PrevRides markers.
    const nearbyRiderMarkers = useMemo(() => buildNearbyRiderMarkers(nearbyRiders?.rows), [nearbyRiders]);
    const riderMarkers = useMemo(
        () => [...prevRiderMarkers, ...nearbyRiderMarkers],
        [prevRiderMarkers, nearbyRiderMarkers]
    );

    // The current rider's own avatar — matches the current-position marker (corner/main map,
    // elevation strips) to the "You" row shown in the prevRides list, rather than rendering with
    // default colors. undefined whenever there's no prevRides list to be inconsistent with.
    const currentAvatar = useMemo(() => {
        const avatar = prevRides?.rows.find((row) => row.isCurrent)?.avatar;
        return avatar ? avatarToConfig(avatar) : undefined;
    }, [prevRides]);

    // Shared with Workout/View.tsx (getGestureHintContent()) - null when there's nothing useful
    // to teach (loadButtonMode==='hidden' with no workout attached, up/down has no effect at all).
    const gestureHintContent = useMemo(
        () => getGestureHintContent({ workoutAttached, loadButtonMode, loadIncrementPct }),
        [workoutAttached, loadButtonMode, loadIncrementPct]
    );

    // Same visibility condition the existing corner map below already uses (unchanged, §1.3.1).
    const mapVisible = !isCompact && mainViewIsNotAMap && !!hasGpx && !!routeData?.points?.length;

    // Route-only corner-widget placement — shared with Video/View.tsx (FIXES_BACKLOG.md item #63).
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

    const transformPosition = useCallback((val: any): LatLng|RoutePoint | undefined|IPosition => {
        if (!val) return undefined;
        // position-update can emit number for other contexts
        if (typeof val === 'number') return undefined;
        const p = val?.position || val;
        return (p?.lat !== undefined && p?.lng !== undefined)
            ? { lat: p.lat, lng: p.lng, routeDistance:p.routeDistance??val?.routeDistance, heading:val?.heading??val?.position?.heading }
            : undefined;
    }, []);

    const transformSVPosition = useCallback((val: IPosition):IPosition => {
        return val
    }, []);

    // The native component's event names are translated onto the service's (desktop-derived)
    // StreetViewEvent vocabulary here, so `onStreetViewEvent()` stays a single code path for
    // both platforms.
    //
    // The service re-binds onDisplayEvent on every getDisplayProperties() call, so it is held
    // in a ref: handlers that changed identity on every page update would push new props to
    // the native view roughly once a second and drown the render trace in noise.
    const displayEventRef = useRef(onDisplayEvent);
    displayEventRef.current = onDisplayEvent;

    // 'Loaded' is what releases the start overlay - without it the overlay used to be torn
    // down onto a panorama that had not loaded yet, i.e. a black screen.
    const onSVLoaded = useCallback(() => {
        displayEventRef.current?.('Loaded')
    }, []);

    // confirms a position update actually rendered - feeds the service's adaptive update delay
    const onSVPanoramaChanged = useCallback(() => {
        displayEventRef.current?.('pano_changed')
    }, []);

    // no imagery at the requested position: a valid answer, not a failure
    const onSVNoPanorama = useCallback(() => {
        displayEventRef.current?.('status_changed')
    }, []);

    // Handle Street View errors: hard failures (e.g. missing API key) go to the service as
    // a true error, while soft timeouts (unavailable) are logged for telemetry only since
    // the panorama may still arrive on retry. The service will set mapStateError which puts
    // the start overlay into a dead end, appropriate only for permanent failures.
    const onSVError = useCallback((reason: string) => {
        if (reason === 'apiKeyMissing') {
            // Hard failure — API key is missing or unreadable, never will resolve
            displayEventRef.current?.('Error', `Maps API key ${reason}`)
        }
        // For 'unavailable' and 'unknown' timeouts, don't report to the service — these are
        // usually transient (slow network, SDK slowness) and retries may succeed. The
        // StreetView component logs these for telemetry.
    }, []);

    const svPosition = displayPosition as IPosition | undefined;

    // Extracted so the swipe-gesture surface (GestureDetector, below) can wrap it without
    // duplicating this whole subtree - same reasoning as Workout/View.tsx's identical `content`.
    const mainContent = (
                <View style={StyleSheet.absoluteFill}>
                    {/* Render main view based on rideView (currently also draw sv and sat as map - to be replaced later) */}
                    { (rideView === 'map' || rideView === 'sat') && (
                        <Dynamic
                            observer={rideObserver ?? undefined}
                            event='position-update'
                            prop='position'
                            transform={transformPosition}
                        >
                            <FreeMap
                                points={routeData?.points as RoutePoint[] ?? []}
                                position={undefined}
                                draggable={false}
                                followPosition={true}
                                zoomControl={false}
                                scrollWheelZoom={false}
                                style={styles.fullScreenMap}
                                riderMarkers={riderMarkers}
                                markerAvatar={currentAvatar}
                            />
                        </Dynamic>
                    )}
                    {/* Corner orientation map — shown only when the main view above isn't itself a map.
                        Route-only rendering, untouched (HLD §9.1). Replaced by RideOverlay's
                        own corner-widget rects whenever overlayActive (a workout is attached, or
                        eligible previous rides exist). */}
                    {!overlayActive && !isCompact && mainViewIsNotAMap && hasGpx && !!routeData?.points?.length && (
                        <View testID='gpx-corner-map' style={[styles.mapOverlay, mapOverlayDynamicStyle]}>
                            <Dynamic
                                observer={rideObserver ?? undefined}
                                event='position-update'
                                prop='position'
                                transform={transformPosition}
                            >
                                <FreeMap
                                    points={routeData.points as RoutePoint[]}
                                    draggable={false}
                                    followPosition={true}
                                    colorActive='blue'
                                    colorInactive='rgba(255,255,255,0.4)'
                                />
                            </Dynamic>
                        </View>
                    )}

                    {/* Dashboard */}
                    <View style={[
                        styles.dashboardContainer,
                        isCompact ? styles.dashboardCompact : styles.dashboardTablet,
                        dashboardDynamicStyle,
                    ]}>
                        <View onLayout={updateDashboardDimensions}>
                            <RideDashboard layout='icon-left' onMetrics={onDashboardMetrics} />
                        </View>
                    </View>

                    {/* 2km Elevation Preview — route-only rendering, untouched (HLD §9.1). See above. */}
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
                                isCompact ? styles.elevationPreviewCompact : styles.elevationPreviewTablet,
                                elevationPreviewDynamicStyle,
                            ]}
                        />
                    )}

                    {/* Overlay (WorkoutDashboard when a workout is attached, previous-rides ear/
                        corner slot when eligible, or both) — additive, prop-driven branch. The
                        `!comboActive || (graph && steps && dashboard)` half preserves the existing
                        "don't mount the combo overlay before workout data is ready" defensiveness —
                        a route-only overlayActive ride never expects that data at all. */}
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
                            mapPoints={routeData?.points as RoutePoint[]}
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

                    {/* Bottom bar: Menu button + Full route elevation, plus the Ride Menu it opens */}
                    <RideBottomBarAndMenu
                        bottomBarStyle={bottomBarStyle}
                        menuButtonContainerStyle={styles.menuButtonContainer}
                        elevationFullStyle={styles.elevationFull}
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
        <View style={styles.container} testID='gpx-tour-page-view'>

            {/* Street View lives outside the start-overlay gate on purpose: the panorama can
                only start loading once the native view is mounted, so gating it on the overlay
                being gone guaranteed the rider saw an empty screen for the whole load. It now
                loads behind the overlay (which covers it via MainBackground) and the service
                closes the overlay when 'Loaded' arrives. */}
            { (rideView === 'sv') && (
                <Dynamic
                    observer={displayObserver}
                    event='position-update'
                    prop='position'
                    transform={transformSVPosition}
                >
                    <SV
                        position={svPosition}
                        style={styles.fullScreenMap}
                        onLoaded={onSVLoaded}
                        onPanoramaChanged={onSVPanoramaChanged}
                        onNoPanorama={onSVNoPanorama}
                        onError={onSVError}
                    />
                </Dynamic>
            )}

            {/* Main content layer, conditionally hidden by start overlay */}
            {!startOverlayProps && (
                gesture ? (
                    <GestureDetector gesture={gesture}>
                        {mainContent}
                    </GestureDetector>
                ) : mainContent
            )}

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

            {/* Start overlay — always on top */}
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
    fullScreenMap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    dashboardContainer: {
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    dashboardCompact: {
        left: 0,
        right: 0,
    },
    dashboardTablet: {
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    elevationPreviewTablet: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    elevationPreviewCompact: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    elevationFull: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.0)',
    },
    menuButtonContainer: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
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
    placeholderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    placeholderText: {
        color: colors.text,
        fontSize: textSizes.dialogTitle,
        textAlign: 'center',
    },
});