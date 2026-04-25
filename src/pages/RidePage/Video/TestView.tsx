import React, { useState,useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, Image  } from 'react-native';
import { IObserver, VideoRidePageDisplayProps, ActivityDashboardItem } from 'incyclist-services';
import {
    RideDashboardView,
    ElevationGraph,
    InfoText,
    StartRideDisplay,
    RideMenu,
    Button,
    MainBackground
} from '../../../components';
import { colors } from '../../../theme';
import { useScreenLayout } from '../../../hooks';

interface VideoRidePageViewProps {
    displayProps: VideoRidePageDisplayProps;
    rideObserver: IObserver | null;
    dbLayout: 'icon-left' | 'icon-top'
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onCloseRidePage: ()=>void;
    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
}

const noop = () => {};

const MOCK_DASHBOARD_ITEMS: ActivityDashboardItem[] = [
    { title: 'Time',      dataState: 'green', data: [{ value: '00:32' }, { value: '-12:45' }] },
    { title: 'Distance',  dataState: 'green', data: [{ value: '12.4', unit: 'km' }, { value: '−2.1', unit: 'km' }] },
    { title: 'Speed',     dataState: 'green', data: [{ value: '28.3', unit: 'km/h' }, { value: '25.1', unit: 'avg' }] },
    { title: 'Power',     dataState: 'green', data: [{ value: '210', unit: 'W' }, { value: '195', unit: 'avg' }] },
    { title: 'Slope',     dataState: 'green', data: [{ value: '3.2', unit: '%' }] },
    { title: 'Heartrate', dataState: 'green', data: [{ value: '158', unit: 'bpm' }, { value: '152', unit: 'avg' }] },
    { title: 'Cadence',   dataState: 'green', data: [{ value: '88', unit: 'rpm' }, { value: '85', unit: 'avg' }] },
];

const MenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id='menu' label='Menu' primary={true} onClick={onPress} />
));

export const VideoRidePageTestView = (props: VideoRidePageViewProps) => {
    const {
        displayProps,
        dbLayout = 'icon-left',
        onMenuOpen,
        onMenuClose,
        onCloseRidePage,
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

    const reservedRight = screenWidth * 0.15;
    const dashboardRightEdge = (screenWidth / 2) + (dashboardWidth / 2);
    const cornerTopOffset = dashboardRightEdge > (screenWidth - reservedRight) ? dashboardHeight+2 : 0;    

    // Dynamic style constants to satisfy no-inline-styles
    const elevationPreviewDynamicStyle = {
        height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
        top: isCompact ? dashboardHeight : cornerTopOffset,
        width: isCompact ? screenWidth * 0.20 : screenWidth * 0.15,
    }
    const bottomBarStyle = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: ELEVATION_FULL_HEIGHT,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    }

    const elevationFullDynamicStyle = { height: ELEVATION_FULL_HEIGHT };
    const dashboardDynamicStyle = { height: DASHBOARD_HEIGHT };

    const updateDashboardDimensions = useCallback((e: any) => {
        setDashboardWidth(e.nativeEvent.layout.width);
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    return (
        <View style={styles.container}>

            <View style={[StyleSheet.absoluteFill, startOverlayProps ? styles.invisible : undefined]}>
                {/* Mock Video Layer */}
                <Image
                    source={{ uri: '/screenshot.jpg' }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />

                {/* Mock Dashboard */}
                <View style={[
                    styles.dashboardContainer,
                    isCompact ? styles.dashboardCompact : styles.dashboardTablet,
                    dashboardDynamicStyle,
                ]}>
                    <View onLayout={updateDashboardDimensions}>
                        <RideDashboardView
                            items={MOCK_DASHBOARD_ITEMS}
                            layout={dbLayout}
                            compact={isCompact}
                        />
                    </View>
                </View>

                {/* 2km Elevation Preview */}
                <ElevationGraph
                    routeData={routeData}
                    observer={undefined}
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

                {infoText && <InfoText {...infoText} />}

                <View style={bottomBarStyle}>
                    {/* Menu Button */}
                    <View style={[styles.menuButtonContainer]}>
                        <MenuButton onPress={onMenuOpen} />
                    </View>

                    {/* Full Route Elevation */}
                    <ElevationGraph
                        routeData={routeData}
                        observer={undefined}
                        lapMode={lapMode}
                        showLine={true}
                        showColors={true}
                        showXAxis={false}
                        showYAxis={false}
                        style={[styles.elevationFull, elevationFullDynamicStyle]}
                    />

                </View>



                {/* Ride Menu */}
                {menuProps && (
                    <RideMenu
                        visible={true}
                        onClose={onMenuClose}
                        onCloseRidePage={onCloseRidePage}

                    />
                )}


            </View>

            {startOverlayProps && <MainBackground />}
            {/* Start Overlay */}
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    menuButtonContainer: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    invisible: {
        opacity: 0
    },

});