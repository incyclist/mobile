import React, { useCallback, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { IObserver, VideoRidePageDisplayProps } from 'incyclist-services';
import {
    Video,
    RideDashboard,
    ElevationGraph,
    InfoText,
    StartRideDisplay,
    RideMenu,
    Button,
    MainBackground,
    FreeMap,
    Dynamic
} from '../../../components';
import { LatLng } from '../../../components/FreeMap/types';
import { colors } from '../../../theme';
import { useScreenLayout } from '../../../hooks';

interface VideoRidePageViewProps {
    displayProps: VideoRidePageDisplayProps;
    rideObserver: IObserver | null;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
}

const noop = () => {};

const MenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id='menu' label='Menu' primary={true} onClick={onPress} />
));

export const VideoRidePageView = (props: VideoRidePageViewProps) => {
    const {
        displayProps,
        rideObserver,
        onMenuOpen,
        onMenuClose,
        onRetryStart,
        onIgnoreStart,
        onCancelStart
    } = props;

    const { video, videos, route, startOverlayProps, menuProps } = displayProps;

    // Derived properties
    const routeData = route?.details;
    const lapMode = route?.description?.isLoop;
    const currentVideo = video ?? videos?.find(v => !v.hidden);
    const infoText = currentVideo?.info;

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    const ELEVATION_FULL_HEIGHT = screenHeight * 0.12;
    const ELEVATION_PREVIEW_HEIGHT = screenHeight * 0.20;
    const DASHBOARD_HEIGHT = screenHeight * 0.10;

    const [dashboardWidth, setDashboardWidth] = useState(0);
    const [dashboardHeight, setDashboardHeight] = useState(DASHBOARD_HEIGHT );
    const updateDashboardDimensions = useCallback((e: any) => {
        setDashboardWidth(e.nativeEvent.layout.width);
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    // Account for both elevation preview and map width
    const reservedRight = screenWidth * 0.15 * 2;
    const dashboardRightEdge = (screenWidth / 2) + (dashboardWidth / 2);
    const cornerTopOffset = dashboardRightEdge > (screenWidth - reservedRight) ? dashboardHeight+2 : 0;    

    // Dynamic style constants to satisfy no-inline-styles
    const elevationPreviewDynamicStyle = {
        height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
        top: isCompact ? dashboardHeight : cornerTopOffset,
        width: isCompact ? screenWidth * 0.20 : screenWidth * 0.15,
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

    const transformPosition = useCallback((val: any): LatLng | undefined => {
        if (!val) return undefined;
        if (typeof val === 'number') return undefined; // position-update can emit number for other contexts
        const p = val?.position;
        return (p?.lat !== undefined && p?.lng !== undefined)
            ? { lat: p.lat, lng: p.lng }
            : undefined;
    }, []);


    return (
        <View style={styles.container}>
            {/* Everything below is rendered but made invisible during start overlay */}


            { !startOverlayProps && <View style={[StyleSheet.absoluteFill]}>
                <View style={[
                    styles.dashboardContainer,
                    isCompact ? styles.dashboardCompact : styles.dashboardTablet,
                    dashboardDynamicStyle
                ]}>
                    <View onLayout={updateDashboardDimensions}>
                        <RideDashboard layout='icon-left'/>
                    </View>
                </View>
            </View>}

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

                {/* Map Overlay */}
                {!isCompact && route?.description?.hasGpx && !!routeData?.points?.length && (
                    <View style={[styles.mapOverlay, mapOverlayDynamicStyle]}>
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
                    </View>
                )}

                {infoText && <InfoText {...infoText} />}

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
                        onClose={onMenuClose}
                    />
                )}
            </View>


            {/* Background shown during start overlay */}
            {startOverlayProps && <MainBackground />}

            {/* Start overlay — always on top, outside invisible wrapper */}
            {startOverlayProps && (
                <StartRideDisplay
                    {...startOverlayProps}
                    onStart={noop}
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
    invisible: {
        opacity: 0,
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
    },
    elevationPreviewCompact: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
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
});