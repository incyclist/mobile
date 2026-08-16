import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions  } from 'react-native';
import {
    IObserver,
    RoutePoint,
    GPXRidePageDisplayProps,
    WorkoutGraphActuals,
} from 'incyclist-services';
import {
    RideDashboard,
    ElevationGraph,
    StartRideDisplay,
    RideMenu,
    Button,
    MainBackground,
    FreeMap,
    Dynamic,
    WorkoutRideOverlay,
} from '../../../components';
import { LatLng } from '../../../components/FreeMap/types';
import { colors, textSizes } from '../../../theme';
import { useScreenLayout } from '../../../hooks';
import { StreetView } from '../../../components/StreetView';
import { IPosition } from '../../../components/StreetView/types';
import {
    getRideDashboardWidth,
    fitsSideBySide,
    buildSideRects,
    RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD,
    DEFAULT_ROUTE_RIDE_TILE_COUNT,
} from '../../../hooks/render/useRideOverlayLayout';

export interface GPXTourPageViewProps {
    displayProps: GPXRidePageDisplayProps;
    rideObserver: IObserver | null;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onCloseRidePage: ()=>void;

    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
    /** Only actually called when a workout is attached (workout-mobile-hld-phase2.md §5) —
     *  unused, harmless, otherwise. */
    getGraphActuals: () => WorkoutGraphActuals;
    onToggleCornerWidget: () => void;
    /** "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3) — see
     *  `Video/View.tsx`'s identical prop for the full rationale. */
    onStopWorkout: () => void;
}

const MenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id='menu' label='Menu' primary={true} onClick={onPress} />
));


const SV = React.memo(StreetView
//    ,(prev,next)=>prev.position?.lat!==next.position?.lat || prev.position?.lng!==next.position?.lng || prev.position?.heading!==next.position?.heading
)

/**
 * TEMPORARY — M1 verification on iOS. REVERT BEFORE MERGE.
 *
 * incyclist-services gates Street View off for iOS in two places
 * (settings/display/ride/service.ts:63 and :79), so 'sv' is never offered in
 * ride settings, and getDisplayProperties() consequently never calls
 * getStreetViewProps() — meaning no Street View position is supplied either.
 * Both have to be bypassed to get the native component on screen at all.
 *
 * This flag renders the native component directly with a fixed position,
 * deliberately skipping the observer/Dynamic plumbing. M1 asks one question —
 * does the native component register, mount and emit its diagnostics — and
 * routing that through service code that is still gated off would answer a
 * different one.
 *
 * Delete this block, `effectiveRideView`, and the M1 branch in the render once
 * the services gate is lifted.
 */
// Annotated `boolean`, not left to inference: as a `true` literal TypeScript
// narrows effectiveRideView to 'sv' and then rejects the 'map'/'sat'
// comparisons below as having no overlap.
const M1_VERIFY_STREETVIEW: boolean = true;

/**
 * Cycled every M1_CYCLE_MS so position updates are actually exercised. A single
 * fixed position cannot answer the two questions that matter on a ride screen:
 * whether the SDK's loading indicator reappears on every panorama change, and
 * how long an update round-trip takes on the slowest device this will ever run
 * on. It also exercises onPanoramaChanged, which a static position never fires.
 *
 * Same coordinates as StreetViewDemoPage: dense, guaranteed coverage, and two
 * distinct locations so both a heading-only change and a real move are covered.
 */
const M1_TEST_POSITIONS: IPosition[] = [
    { lat: 40.758,  lng: -73.9855, heading: 0 },    // Times Square, N
    { lat: 40.758,  lng: -73.9855, heading: 90 },   // Times Square, E — heading only
    { lat: 40.7589, lng: -73.9851, heading: 0 },    // ~100m up 7th Ave — real move
    { lat: 51.5055, lng: -0.0754,  heading: 0 },    // Tower Bridge — long jump
];

const M1_CYCLE_MS = 5000;

export const GPXTourPageView = (props: GPXTourPageViewProps) => {
    const {
        displayProps,
        rideObserver,
        onMenuOpen,
        onMenuClose,
        onCloseRidePage,
        onRetryStart,
        onIgnoreStart,
        onCancelStart,
        getGraphActuals,
        onToggleCornerWidget,
        onStopWorkout,
    } = props;

    const { startOverlayProps,menuProps,rideView,route,displayObserver,displayPosition,onDisplayEvent,workoutAttached,graph,steps,dashboard,cornerWidget} = displayProps??{};

    // Derived properties
    const routeData = route?.details;
    const lapMode = route?.description?.isLoop;
    const hasGpx = route?.description?.hasGpx;

    // Whether the full-screen main view already shows a map, making the corner orientation map
    // redundant. Deliberately not `rideView !== 'map'`: GPX also renders 'sat' through FreeMap as a
    // full-screen map today ("currently also draw sv and sat as map - to be replaced later"), so that
    // predicate would double-render a map on top of a map. Update to
    // `rideView === 'sv' || rideView === 'sat'` once SatelliteView is a real, distinct view.
    // TEMPORARY (M1/M2): cycles the forced position. Revert with the M1 block.
    const [m1Index, setM1Index] = useState(0);
    useEffect(() => {
        if (!M1_VERIFY_STREETVIEW) return;
        const timer = setInterval(
            () => setM1Index(i => (i + 1) % M1_TEST_POSITIONS.length),
            M1_CYCLE_MS,
        );
        return () => clearInterval(timer);
    }, []);

    const mainViewIsNotAMap = rideView === 'sv';

    // TEMPORARY (M1): used ONLY to suppress the full-screen map layer, which is a
    // later absolute-fill sibling and would otherwise paint over the Street View.
    // Deliberately not used for mainViewIsNotAMap — the corner-map logic is no part
    // of what M1 verifies, and overriding it there just breaks its tests.
    const effectiveRideView = M1_VERIFY_STREETVIEW ? 'sv' : rideView;

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    // Additive branch, workout-mobile-hld-phase2.md §5 — see Video/View.tsx's identical comment.
    const comboActive = !!workoutAttached;

    const ELEVATION_FULL_HEIGHT = screenHeight * 0.12;
    const ELEVATION_PREVIEW_HEIGHT = screenHeight * 0.20;
    const DASHBOARD_HEIGHT = screenHeight * 0.10;

    // Width is no longer measured (post-Wave-6 fix, see Video/View.tsx's identical comment).
    const [dashboardHeight, setDashboardHeight] = useState(DASHBOARD_HEIGHT);
    const updateDashboardDimensions = useCallback((e: any) => {
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    // RideDashboard's own reported tile count — tracked unconditionally now, see Video/View.tsx's
    // identical comment.
    const [dashboardItemCount, setDashboardItemCount] = useState<number | undefined>(undefined);
    const onDashboardMetrics = useCallback((m: { itemCount: number }) => setDashboardItemCount(m.itemCount), []);

    // Same visibility condition the existing corner map below already uses (unchanged, §1.3.1).
    const mapVisible = !isCompact && mainViewIsNotAMap && !!hasGpx && !!routeData?.points?.length;

    // Route-only corner-widget placement — see Video/View.tsx's identical comment for the full
    // rationale (ports the combo overlay's analytic fit-check/sizing instead of the old
    // measured-width heuristic).
    const dashboardLayoutMode = (dashboardItemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT) > RIDE_DASHBOARD_ICON_TOP_TILE_THRESHOLD
        ? 'icon-top' : 'icon-left';
    const rideDashboardWidthEffective = Math.min(
        getRideDashboardWidth({
            itemCount: dashboardItemCount ?? DEFAULT_ROUTE_RIDE_TILE_COUNT,
            layout: dashboardLayoutMode,
            compact: isCompact,
            screenWidth,
        }),
        screenWidth,
    );
    const sideBySideFits = !isCompact && fitsSideBySide(screenWidth, screenHeight, rideDashboardWidthEffective);
    const sideRects = sideBySideFits
        ? buildSideRects(screenWidth, screenHeight, rideDashboardWidthEffective, 0, mapVisible)
        : null;

    // Stacked-below fallback — compact, or the side widgets don't fit beside the dashboard.
    // Unchanged from before the fix.
    const reservedRight = screenWidth * (isCompact ? 0.20 : 0.15);
    const cornerTopOffset = dashboardHeight + 2;
    const elevationPreviewDynamicStyle = sideRects
        ? { top: sideRects.elevation.top, right: sideRects.elevation.right, width: sideRects.elevation.width, height: sideRects.elevation.height }
        : {
            height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
            top: isCompact ? dashboardHeight : cornerTopOffset,
            width: reservedRight,
        };
    const dashboardDynamicStyle = { height: DASHBOARD_HEIGHT };

    const mapOverlayDynamicStyle = sideRects?.map
        ? { top: sideRects.map.top, left: sideRects.map.left, width: sideRects.map.width, height: sideRects.map.height }
        : {
            width: screenWidth * 0.15,
            height: ELEVATION_PREVIEW_HEIGHT,
            top: cornerTopOffset,
        };

    const bottomBarStyle = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: ELEVATION_FULL_HEIGHT,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    };

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

    // Deliberately NOT reported as 'Error': the native 'unavailable' reason is only a timeout
    // and the panorama may still arrive, while a mapStateError puts the start overlay into a
    // dead end whose only button is Cancel. The component logs the error for telemetry.
    const svPosition = displayPosition as IPosition | undefined;

    return (
        <View style={styles.container} testID='gpx-tour-page-view'>

            {/* Street View lives outside the start-overlay gate on purpose: the panorama can
                only start loading once the native view is mounted, so gating it on the overlay
                being gone guaranteed the rider saw an empty screen for the whole load. It now
                loads behind the overlay (which covers it via MainBackground) and the service
                closes the overlay when 'Loaded' arrives. */}
            { (M1_VERIFY_STREETVIEW) && (
                <SV
                    position={M1_TEST_POSITIONS[m1Index]}
                    style={styles.fullScreenMap}
                    onLoaded={onSVLoaded}
                    onPanoramaChanged={onSVPanoramaChanged}
                    onNoPanorama={onSVNoPanorama}
                />
            )}

            { (!M1_VERIFY_STREETVIEW && rideView === 'sv') && (
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
                    />
                </Dynamic>
            )}

            {/* Main content layer, conditionally hidden by start overlay */}
            {!startOverlayProps && (
                <View style={StyleSheet.absoluteFill}>
                    {/* Render main view based on rideView (currently also draw sv and sat as map - to be replaced later) */}
                    { (effectiveRideView === 'map' || effectiveRideView === 'sat') && (
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
                            />
                        </Dynamic>
                    )}
                    {/* Corner orientation map — shown only when the main view above isn't itself a map.
                        Route-only rendering, untouched (HLD §9.1). Replaced by WorkoutRideOverlay's
                        own corner-widget rects when a workout is attached and the combo toggle is on. */}
                    {!comboActive && !isCompact && mainViewIsNotAMap && hasGpx && !!routeData?.points?.length && (
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
                    {!comboActive && (
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

                    {/* Workout overlay (WorkoutDashboard + resolved arrangement) — additive,
                        prop-driven branch. workout-mobile-hld-phase2.md §5, ride-overlay-layout-design.md §5. */}
                    {comboActive && graph && steps && dashboard && (
                        <WorkoutRideOverlay
                            itemCount={dashboardItemCount}
                            mapVisible={mapVisible}
                            measuredRideDashboardHeight={dashboardHeight}
                            graph={graph}
                            steps={steps}
                            dashboard={dashboard}
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
                        />
                    )}

                    {/* Bottom bar: Menu button + Full route elevation */}
                    <View style={bottomBarStyle}>
                        <View style={styles.menuButtonContainer}>
                            <MenuButton onPress={onMenuOpen} />
                        </View>
                        <ElevationGraph
                            routeData={routeData}
                            observer={rideObserver ?? undefined}
                            lapMode={lapMode}
                            showLine={true}
                            showColors={true}
                            showXAxis={false}
                            showYAxis={false}
                            style={styles.elevationFull}
                        />
                    </View>

                {/* Ride Menu */}
                {menuProps && (
                    <RideMenu
                        visible={true}
                        finished={menuProps.finished}
                        onClose={onMenuClose}
                        onCloseRidePage={onCloseRidePage}
                    />
                )}


                </View>
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