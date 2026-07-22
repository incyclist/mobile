import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import type { WorkoutGraphActuals, WorkoutRidePageDisplayProps } from 'incyclist-services';
import { WorkoutRidePageView } from './View';
import {
    MOCK_ACTUALS_MID,
    MOCK_ACTUALS_SKIPBACK,
    MOCK_PLAN_LIVE_MID,
    MOCK_PLAN_LIVE_SKIPBACK,
} from '../../../components/WorkoutGraph/WorkoutGraph.mock';

/**
 * Real page-assembly story (session 5.6) — supersedes the session-4.2 `WorkoutRidePrototype`
 * checkpoint story (kept as historical record, not deleted). Targets `WorkoutRidePageView`
 * (the pure view, per this repo's Storybook rules), driven by hand-authored
 * `WorkoutRidePageDisplayProps` mocks reused from the signed-off 4.2 prototype so the two stay
 * visually comparable.
 */

const callbacks = {
    onMenuOpen: fn(),
    onMenuClose: fn(),
    onCloseRidePage: fn(),
    onRetryStart: fn(),
    onIgnoreStart: fn(),
    onCancelStart: fn(),
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative', width: '100%' },
});

const meta: Meta<typeof WorkoutRidePageView> = {
    title: 'Pages/WorkoutRidePage',
    component: WorkoutRidePageView,
    args: {
        ...callbacks,
        rideObserver: null,
        gesture: undefined,
        feedback: { visible: false, message: '' },
        loadIncrementPct: 1,
        getGraphActuals: (): WorkoutGraphActuals => ({ power: [], heartrate: [], position: 0 }),
    },
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

type Story = StoryObj<typeof WorkoutRidePageView>;

const MID_WORKOUT: WorkoutRidePageDisplayProps = {
    rideState: 'Active',
    rideType: 'Workout',
    startOverlayProps: null,
    startGateProps: null,
    menuProps: { showResume: false, canStepBack: true, canStepForward: true },
    graph: MOCK_PLAN_LIVE_MID,
    steps: {
        previous: { label: '200W', targetPower: 200, duration: 300, remaining: null, isCurrent: false },
        current: { label: '280W', targetPower: 280, duration: 180, remaining: 30, isCurrent: true },
        upcoming: [
            { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
            { label: '280W', targetPower: 280, duration: 180, remaining: null, isCurrent: false },
            { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
        ],
        hasMore: true,
    },
    dashboard: { text: '280W for 3min - VO2 max (1/3)', mode: 'ERG' },
    title: 'VO2 max (1/3)',
};

const AFTER_SKIP_BACK: WorkoutRidePageDisplayProps = {
    rideState: 'Active',
    rideType: 'Workout',
    startOverlayProps: null,
    startGateProps: null,
    menuProps: { showResume: false, canStepBack: true, canStepForward: false },
    graph: MOCK_PLAN_LIVE_SKIPBACK,
    steps: {
        previous: { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
        current: { label: 'Ramp 150-100W', targetPower: 125, duration: 300, remaining: 150, isCurrent: true },
        upcoming: [],
        hasMore: false,
    },
    dashboard: { text: 'Ramp 150-100W for 5min - Cooldown', mode: 'ERG' },
    title: 'Cooldown',
};

const STARTING: WorkoutRidePageDisplayProps = {
    rideState: 'Starting',
    rideType: 'Workout',
    startOverlayProps: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'Smart Trainer', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'Polar Hrm', isControl: false, status: 'Starting', capabilities: ['heartrate'] },
        ],
        readyToStart: true,
    } as any,
    startGateProps: null,
    menuProps: null,
    graph: { bars: [], ftp: 0, ftpLine: 0, domain: { x: [0, 0], y: [0, 0] } },
    steps: { previous: null, current: null, upcoming: [], hasMore: false },
    dashboard: { text: '', mode: null },
    title: '',
};

export const MidWorkout: Story = {
    args: {
        displayProps: MID_WORKOUT,
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
    },
};

/** Same session, after the skip-back — compare the graph's trailing x-tick and steps' "end of workout" hint. */
export const AfterSkipBack: Story = {
    args: {
        displayProps: AFTER_SKIP_BACK,
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_SKIPBACK,
    },
};

export const MenuOpen: Story = {
    args: {
        displayProps: { ...MID_WORKOUT, menuProps: { showResume: false, canStepBack: true, canStepForward: true } },
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
    },
};

/** Waiting for pedaling — the new session-5.6 gesture legend under the device list. */
export const Starting: Story = {
    args: {
        displayProps: STARTING,
        loadIncrementPct: 2,
    },
};

/** Frozen frame right after a swipe-up fires — judges the toast against the real page layout. */
export const SwipeFeedback: Story = {
    args: {
        displayProps: MID_WORKOUT,
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
        feedback: { visible: true, message: '+1%' },
    },
};
