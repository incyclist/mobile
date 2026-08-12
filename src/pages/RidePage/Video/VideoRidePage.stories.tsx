import React from 'react';
import { StyleSheet, useWindowDimensions, View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { VideoRidePageTestView, MOCK_DASHBOARD_ITEMS_VIRTUAL_SHIFTING } from './TestView';
import { Dialog } from '../../../components';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../../../components/WorkoutDashboard/WorkoutDashboard.mock';
import { colors, textSizes } from '../../../theme';
import { StartGateProps } from 'incyclist-services';
import sydneyRoute from '../../../../__tests__/testdata/sydney.json';
import teideRoute from '../../../../__tests__/testdata/ES_Teide.json';

const MOCK_START_GATE_PROPS: StartGateProps = {
    title: 'Session refresh needed',
    body: 'Please connect to the internet before starting your ride',
};

const callbacks = {
    onMenuOpen: fn(),
    onMenuClose: fn(),
    onCloseRidePage: fn(),
    onPause: fn(),
    onResume: fn(),
    onEndRide: fn(),
    onRetryStart: fn(),
    onIgnoreStart: fn(),
    onCancelStart: fn(),
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative', width: '100%' },
    gateBody: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
    },
});

const meta: Meta<typeof VideoRidePageTestView> = {
    title: 'Pages/VideoRidePage',
    component: VideoRidePageTestView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();

            const fullScreen = { minHeight: height || 500, minWidth: width || 800 };
            return (
                <View style={[styles.container, fullScreen]}>
                    <Story />
                </View>
            );
        },
    ],
};

export default meta;

type Story = StoryObj<typeof VideoRidePageTestView>;

export const ActiveRide: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};
export const ActiveRideTop: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        dbLayout: 'icon-top',
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const MenuOpenActive: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: { showResume: false },
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const MenuOpenPaused: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Paused',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: { showResume: true },
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const Starting: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Starting',
            rideType: 'Video',
            startOverlayProps: {
                mode: 'Video',
                rideState: 'Starting',
                devices: [
                    { udid: '1', name: 'Smart Trainer', isControl: true, status: 'Starting', capabilities: ['control'] },
                ],
                readyToStart: false,
                videoState: 'Buffering',
            } as any,
            startGateProps: null,
            menuProps: null,
            route: teideRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const WithStartGate: Story = {
    args: {
        ...ActiveRide.args,
        displayProps: {
            ...ActiveRide.args!.displayProps!,
            startGateProps: MOCK_START_GATE_PROPS,
        },
    },
    render: (args) => {
        const startGateProps = args.displayProps?.startGateProps;
        return (
            <View style={styles.container}>
                <VideoRidePageTestView {...args} />
                {startGateProps && (
                    <Dialog
                        title={startGateProps.title}
                        variant="info"
                        buttons={[
                            { id: 'connect', label: 'Connect now', primary: true, onClick: fn() },
                            { id: 'continue', label: 'Continue anyway', onClick: fn() },
                        ]}
                    >
                        <Text style={styles.gateBody}>{startGateProps.body}</Text>
                    </Dialog>
                )}
            </View>
        );
    },
};

// ---------------------------------------------------------------------------
// Workout overlay (session 5.1 — workout-mobile-hld-phase2.md §5/§9.1). Same `WorkoutRideOverlay`
// component GPXTourPage's combo stories use, mounted through this file's shared mock background/
// dashboard rather than the real service-backed `RideDashboard` (which renders nothing at all in
// Storybook — no live `useActivityRide()` observer to attach to — the exact problem this test
// view's mock `RideDashboardView` + `MOCK_DASHBOARD_ITEMS` already exists to work around).
// ---------------------------------------------------------------------------

// GPX-shaped route data reused for its corner-map-eligible points, same fixture
// GPXTourPage.stories.tsx's combo stories use.
const gpxRoute = {
    description: { hasGpx: true, isLoop: false },
    details: { points: (sydneyRoute as any).points },
};

const workoutOverlayArgs = {
    workoutGraph: MOCK_DASHBOARD_MID_INTERVAL.graph,
    workoutSteps: MOCK_DASHBOARD_MID_INTERVAL.steps,
    workoutDashboardLine: MOCK_DASHBOARD_MID_INTERVAL.line,
};

/** Workout attached, combo active — corner map (route has GPX data) plus the workout overlay's
 *  arrangement, replacing the plain elevation preview/map above. */
export const WorkoutOverlayActive: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        ...workoutOverlayArgs,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: gpxRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

/** Virtual shifting on (Gear tile → 8 columns → `RideDashboard`'s real `icon-top` switch, same
 *  threshold `RideDashboard.tsx` itself uses) *and* an active workout at the same time — the
 *  combination session 4.1 flagged (HLD §8.7 finding 5): the overlay must be positioned off the
 *  *measured* dashboard height, not the ratio estimate, so it doesn't sit inside the taller
 *  8-tile dashboard band for a frame. */
export const WorkoutOverlayVirtualShifting: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        dashboardItems: MOCK_DASHBOARD_ITEMS_VIRTUAL_SHIFTING,
        ...workoutOverlayArgs,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: gpxRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

/** Phone-landscape viewport — pick a "phone" preset in the toolbar to see the fallback arrangement
 *  (2-way Elevation/Workout corner toggle) instead of block-side/t-side. */
export const WorkoutOverlayFallback: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        ...workoutOverlayArgs,
        cornerWidget: 'elevation',
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: gpxRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
    parameters: {
        viewport: { defaultViewport: 's23Ultra' },
    },
};