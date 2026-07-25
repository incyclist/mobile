import React, { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityRideService, Observer } from 'incyclist-services';
import type { ActivityDashboardItem, WorkoutGraphActuals, WorkoutRidePageDisplayProps } from 'incyclist-services';
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
    onGestureHintDismissed: fn(),
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative', width: '100%' },
});

const MOCK_ACTIVITY_DASHBOARD_ITEMS: ActivityDashboardItem[] = [
    { title: 'Time', data: [{ value: '0:12:30' }] },
    { title: 'Power', data: [{ value: '278', unit: 'W' }, { value: '245', label: 'avg' }] },
    { title: 'Heartrate', data: [{ value: '151', unit: 'bpm' }, { value: '142', label: 'avg' }] },
    { title: 'Cadence', data: [{ value: '92', unit: 'rpm' }, { value: '88', label: 'avg' }] },
];

/**
 * `RideDashboard` (rendered inside `WorkoutRidePageView`, same as `VideoRidePageView`/
 * `GPXTourPageView`) is a smart component — it calls `useActivityRide()` directly, which is a
 * live `@Singleton` service with no data outside a real ride, so it renders nothing here.
 * `incyclist-services` doesn't surface its `Inject()` DI-override helper (the one `services`'
 * own Jest tests use, e.g. `services/src/workouts/ride/page/service.unit.test.ts`) through its
 * public package API, so this seeds the `@Singleton`-backed `ActivityRideService` instance
 * directly instead: `useActivityRide()` is just `new ActivityRideService()` under the hood, and
 * `@Singleton` guarantees every subsequent call — including `RideDashboard`'s — returns this
 * same, already-patched instance. Module-level, so it runs once before any story renders.
 */
const activityRideInstance = new ActivityRideService();
activityRideInstance.getObserver = () => new Observer();
activityRideInstance.getDashboardDisplayProperties = () => MOCK_ACTIVITY_DASHBOARD_ITEMS;

/**
 * `<Dynamic>` (see Dynamic.tsx) only subscribes to `rideObserver` and pulls a fresh
 * `getGraphActuals()` snapshot when it's given a non-null observer — with `rideObserver: null`
 * the whole subscription effect short-circuits and `WorkoutGraph` never receives `actuals`,
 * regardless of how good a story's `getGraphActuals` mock is. This renderer gives every story a
 * real `Observer` (per-story instance, so stories don't share subscription state) and emits a
 * single `data-update` tick right after mount — mirroring the real ride observer's tick — so
 * `<Dynamic>` calls `getGraphActuals()` and the graph actually shows each story's mock data.
 */
const WorkoutRidePageStoryRenderer = (args: React.ComponentProps<typeof WorkoutRidePageView>) => {
    const observerRef = useRef<Observer | null>(null);
    if (!observerRef.current) {
        observerRef.current = new Observer();
    }

    useEffect(() => {
        observerRef.current?.emit('data-update');
    }, []);

    return <WorkoutRidePageView {...args} rideObserver={observerRef.current} />;
};

const meta: Meta<typeof WorkoutRidePageView> = {
    title: 'Pages/WorkoutRidePage',
    component: WorkoutRidePageView,
    render: (args) => <WorkoutRidePageStoryRenderer {...args} />,
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
    menuProps: null,
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
    gestureHint: null,
};

const AFTER_SKIP_BACK: WorkoutRidePageDisplayProps = {
    rideState: 'Active',
    rideType: 'Workout',
    startOverlayProps: null,
    startGateProps: null,
    menuProps: null,
    graph: MOCK_PLAN_LIVE_SKIPBACK,
    steps: {
        previous: { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
        current: { label: 'Ramp 150-100W', targetPower: 125, duration: 300, remaining: 150, isCurrent: true },
        upcoming: [],
        hasMore: false,
    },
    dashboard: { text: 'Ramp 150-100W for 5min - Cooldown', mode: 'ERG' },
    title: 'Cooldown',
    gestureHint: null,
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
    gestureHint: null,
};

/**
 * StartRideDisplay has just cleared (startOverlayProps: null) but no pedaling has happened yet
 * (session 5.9 — WorkoutRidePageService's gestureHint is non-null only in exactly this window).
 * Reuses MID_WORKOUT's graph/steps/dashboard content to demonstrate the overlay's core
 * requirement: it must NOT obscure the ride screen — dashboard/graph/steps stay fully visible
 * underneath the translucent scrim, only the text/legend block itself gets a backing.
 */
const WAITING_FOR_PEDAL: WorkoutRidePageDisplayProps = {
    ...MID_WORKOUT,
    gestureHint: { visible: true },
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

/** Waiting for devices to connect — StartRideDisplay's device list, before it clears. */
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

/**
 * Session 5.9 — StartRideDisplay has cleared and no pedaling has happened yet, so
 * WorkoutGestureHintOverlay is showing. `iphone15Pro`/`ipadPro12` are the two custom viewports
 * already registered in `.storybook/preview.ts`; their heights (393 / 1024) sit on either side
 * of `useScreenLayout()`'s compact threshold (<420), so these two stories exercise the overlay's
 * real compact/normal font-size branch (not just the standalone component story's `compact`
 * prop toggle) atop the real page composition.
 */
export const WaitingForPedalCompact: Story = {
    args: {
        displayProps: WAITING_FOR_PEDAL,
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
    },
    parameters: {
        viewport: { defaultViewport: 'iphone15Pro' },
    },
};

export const WaitingForPedalNormal: Story = {
    args: {
        displayProps: WAITING_FOR_PEDAL,
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
    },
    parameters: {
        viewport: { defaultViewport: 'ipadPro12' },
    },
};

/**
 * Same "waiting for pedal" moment, after the overlay has been dismissed (gestureHint: null) —
 * dashboard/graph/steps are unaffected either way, since the overlay never altered them; this
 * story exists to make that "with vs. without" comparison explicit side-by-side with the two above.
 */
export const WaitingForPedalDismissed: Story = {
    args: {
        displayProps: { ...WAITING_FOR_PEDAL, gestureHint: null },
        getGraphActuals: (): WorkoutGraphActuals => MOCK_ACTUALS_MID,
    },
};
