import React, { useCallback, useState } from 'react';
import { View, StyleSheet, useWindowDimensions  } from 'react-native';
import {
    IObserver,
    RoutePoint,
    GPXRidePageDisplayProps,
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
} from '../../../components';
import { LatLng } from '../../../components/FreeMap/types';
import { colors, textSizes } from '../../../theme';
import { useScreenLayout } from '../../../hooks';
import { StreetView } from '../../../components/StreetView';
import { IPosition } from '../../../components/StreetView/types';

export interface GPXTourPageViewProps {
    displayProps: GPXRidePageDisplayProps;
    rideObserver: IObserver | null;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onCloseRidePage: ()=>void;

    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
}

const MenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id='menu' label='Menu' primary={true} onClick={onPress} />
));


const SV = React.memo(StreetView
//    ,(prev,next)=>prev.position?.lat!==next.position?.lat || prev.position?.lng!==next.position?.lng || prev.position?.heading!==next.position?.heading
)

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
    } = props;

    const { startOverlayProps,menuProps,rideView,route,displayObserver} = displayProps??{};

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

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    const ELEVATION_FULL_HEIGHT = screenHeight * 0.12;
    const ELEVATION_PREVIEW_HEIGHT = screenHeight * 0.20;
    const DASHBOARD_HEIGHT = screenHeight * 0.10;

    const [dashboardWidth, setDashboardWidth] = useState(0);
    const [dashboardHeight, setDashboardHeight] = useState(DASHBOARD_HEIGHT);
    const updateDashboardDimensions = useCallback((e: any) => {
        setDashboardWidth(e.nativeEvent.layout.width);
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    // Account for both elevation preview width
    const reservedRight = screenWidth * (isCompact ? 0.20 : 0.15);
    const dashboardRightEdge = (screenWidth / 2) + (dashboardWidth / 2);
    const cornerTopOffset = dashboardRightEdge > (screenWidth - reservedRight) ? dashboardHeight + 2 : 0;

    // Dynamic style constants to satisfy no-inline-styles
    const elevationPreviewDynamicStyle = {
        height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
        top: isCompact ? dashboardHeight : cornerTopOffset,
        width: reservedRight,
    };
    const dashboardDynamicStyle = { height: DASHBOARD_HEIGHT };

    const mapOverlayDynamicStyle = {
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

    return (
        <View style={styles.container} testID='gpx-tour-page-view'>

            
            {/* Main content layer, conditionally hidden by start overlay */}
            {!startOverlayProps && (
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
                            />
                        </Dynamic>
                    )}
                    { (rideView === 'sv' ) && (
                        <Dynamic
                            observer={displayObserver}
                            event='position-update'
                            prop='position'
                            transform={transformSVPosition}
                        >
                            <SV
                                position={routeData?.points?.[0] as IPosition}                                
                                style={styles.fullScreenMap}
                            />
                        </Dynamic>
                    )}

                    {/* Corner orientation map — shown only when the main view above isn't itself a map */}
                    {!isCompact && mainViewIsNotAMap && hasGpx && !!routeData?.points?.length && (
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
                            <RideDashboard layout='icon-left' />
                        </View>
                    </View>

                    {/* 2km Elevation Preview */}
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