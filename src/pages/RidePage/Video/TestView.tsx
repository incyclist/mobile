import React, { useState,useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, Image  } from 'react-native';
import type {
    IObserver,
    VideoRidePageDisplayProps,
    ActivityDashboardItem,
    WorkoutGraphPlan,
    WorkoutUpcomingSteps,
    WorkoutDashboardLine,
} from 'incyclist-services';
import {
    RideDashboardView,
    ElevationGraph,
    InfoText,
    StartRideDisplay,
    RideMenu,
    Button,
    MainBackground,
    RideOverlay,
} from '../../../components';
import { colors } from '../../../theme';
import { useScreenLayout } from '../../../hooks';
import { createSharedRideViewStyles } from './sharedRideViewStyles';

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
    /** Overrides the 7-tile default — pass `MOCK_DASHBOARD_ITEMS_VIRTUAL_SHIFTING` to show the
     *  8th Gear tile (`ride-overlay-layout-design.md` §1.2's virtual-shifting-adds-a-tile case). */
    dashboardItems?: ActivityDashboardItem[];
    /** Workout overlay (session 5.1), mock-driven the same way the rest of this test view is —
     *  the real `RideOverlay` component, real `useRideOverlayLayout()` hook, but fed a
     *  static dashboard-item count instead of a live `useActivityRide()` observer, since Storybook
     *  has no running ride service for the real `RideDashboard` (which this test view intentionally
     *  never uses) to attach to either. Omit all three to render the plain, no-workout baseline. */
    workoutGraph?: WorkoutGraphPlan;
    workoutSteps?: WorkoutUpcomingSteps;
    workoutDashboardLine?: WorkoutDashboardLine;
    cornerWidget?: 'elevation' | 'workout';
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

/** Virtual shifting on adds the Gear tile as the 8th column, which is also what forces
 *  `RideDashboard`'s real 'icon-top' layout switch (`items.length>7`, `RideDashboard.tsx`). */
export const MOCK_DASHBOARD_ITEMS_VIRTUAL_SHIFTING: ActivityDashboardItem[] = [
    ...MOCK_DASHBOARD_ITEMS,
    { title: 'Gear', dataState: 'green', data: [{ value: '3', unit: 'front' }, { value: '7', unit: 'rear' }] },
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
        onCancelStart,
        dashboardItems = MOCK_DASHBOARD_ITEMS,
        workoutGraph,
        workoutSteps,
        workoutDashboardLine,
        cornerWidget,
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

    // Mirrors View.tsx's real comboActive gate — see that file for the full rationale. Storybook
    // has no feature-toggle service to read, so this test view is driven entirely by whether the
    // three workout props are present, per-story, rather than a toggle.
    const comboActive = !!(workoutGraph && workoutSteps && workoutDashboardLine);
    const confirmedDbLayout = dashboardItems.length > 7 ? 'icon-top' : dbLayout;
    const mapVisible = !isCompact && !!route?.description?.hasGpx && !!routeData?.points?.length;

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
                    shared.dashboardContainer,
                    isCompact ? shared.dashboardCompact : shared.dashboardTablet,
                    dashboardDynamicStyle,
                ]}>
                    <View onLayout={updateDashboardDimensions}>
                        <RideDashboardView
                            items={dashboardItems}
                            layout={confirmedDbLayout}
                            compact={isCompact}
                        />
                    </View>
                </View>

                {/* 2km Elevation Preview — suppressed when the workout overlay owns the corner
                    widgets instead (mirrors View.tsx's real `!comboActive` gate). */}
                {!comboActive && (
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
                            isCompact ? shared.elevationPreviewCompact : shared.elevationPreviewTablet,
                            elevationPreviewDynamicStyle,
                        ]}
                    />
                )}

                {comboActive && (
                    <RideOverlay
                        itemCount={dashboardItems.length}
                        mapVisible={mapVisible}
                        measuredRideDashboardHeight={dashboardHeight}
                        graph={workoutGraph!}
                        steps={workoutSteps!}
                        dashboard={workoutDashboardLine!}
                        cornerWidget={cornerWidget}
                        dashboardHeight={dashboardHeight}
                        compact={isCompact}
                        rideObserver={null}
                        getGraphActuals={() => ({ power: [], heartrate: [], position: 0 })}
                        onToggleCornerWidget={noop}
                        routeData={routeData}
                        lapMode={lapMode}
                        mapPoints={routeData?.points}
                        transformPosition={(v) => v}
                        onStopWorkout={noop}
                        getPrevRidesRows={() => []}
                    />
                )}

                {infoText && <InfoText {...infoText} />}

                <View style={bottomBarStyle}>
                    {/* Menu Button */}
                    <View style={[shared.menuButtonContainer]}>
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
                        style={[shared.elevationFull, elevationFullDynamicStyle]}
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

// Style entries shared with Video/View.tsx (FIXES_BACKLOG.md item #63) live in
// sharedRideViewStyles; only what's actually specific to this test view is declared below.
const shared = createSharedRideViewStyles('rgba(255, 255, 255, 0.05)');

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
        opacity: 0
    },
});
