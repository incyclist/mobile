import React from 'react';
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
    MainBackground
} from '../../../components';
import { colors } from '../../../theme';
import { useScreenLayout } from '../../../hooks';

interface VideoRidePageViewProps {
    displayProps: VideoRidePageDisplayProps;
    rideObserver: IObserver | null;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onPause: () => void;
    onResume: () => void;
    onEndRide: () => void;
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
        onPause, 
        onResume, 
        onEndRide, 
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

    // Dynamic style constants to satisfy no-inline-styles
    const elevationPreviewDynamicStyle = {
        height: isCompact ? ELEVATION_FULL_HEIGHT : ELEVATION_PREVIEW_HEIGHT,
        top: isCompact ? DASHBOARD_HEIGHT : 0,
        width: isCompact ? screenWidth * 0.20 : screenWidth * 0.15,
    };
    const dashboardDynamicStyle = { height: DASHBOARD_HEIGHT };

    const bottomBarStyle = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: ELEVATION_FULL_HEIGHT,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    };

    return (
        <View style={styles.container}>
            {/* Everything below is rendered but made invisible during start overlay */}
            <View style={[StyleSheet.absoluteFill, startOverlayProps ? styles.invisible : undefined]}>

                {/* Video Layer */}
                {video && (
                    <Video 
                        key={video.src} 
                        width='100%' 
                        height='100%' 
                        {...video} 
                        observer={rideObserver ?? undefined} 
                    />
                )}
                {videos?.map(v => (
                    <Video 
                        key={v.src} 
                        width='100%' 
                        height='100%' 
                        {...v} 
                        observer={rideObserver ?? undefined} 
                    />
                ))}

                {/* Dashboard */}
                <View style={[
                    styles.dashboardContainer, 
                    isCompact ? styles.dashboardCompact : styles.dashboardTablet,
                    dashboardDynamicStyle
                ]}>
                    <RideDashboard />
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
                        {...menuProps}
                        onClose={onMenuClose}
                        onPause={onPause}
                        onResume={onResume}
                        onEndRide={onEndRide}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menuButtonContainer: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
