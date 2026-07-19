import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import type {
    ActivityDashboardItem,
    WorkoutGraphActuals,
    WorkoutRidePageDisplayProps,
} from 'incyclist-services';
import { Button, WorkoutStepsList, WorkoutSwipeFeedback } from '../../../components';
import { RideDashboardView } from '../../../components/RideDashboard/RideDashboardView';
import { WorkoutGraphView } from '../../../components/WorkoutGraph/WorkoutGraphView';
import {
    MOCK_ACTUALS_MID,
    MOCK_ACTUALS_SKIPBACK,
    MOCK_PLAN_LIVE_MID,
    MOCK_PLAN_LIVE_SKIPBACK,
} from '../../../components/WorkoutGraph/WorkoutGraph.mock';

/**
 * Session 4.2 — visual layout checkpoint for the Workout ride screen
 * (workout-mobile-hld.md §5 "Ride screen — layout",
 * workout-ride-page-service-design.md §3).
 *
 * This is a PROTOTYPE assembled inside the story file: it composes the real
 * `WorkoutGraphView` (`live` mode, session 3.1), `WorkoutStepsList` (3.3) and
 * `RideDashboardView` (with the 3.3 workout-shoutout extension) into the
 * `WorkoutRidePage` layout, driven by hand-authored
 * `WorkoutRidePageDisplayProps` mocks. No service, no gestures, no `RideMenu`,
 * no navigation — the real page assembly is session 5.6 (which also switches
 * the in-flow column below to the app's absolute-overlay ride-screen
 * convention once the full-screen gesture container from 5.4 exists).
 *
 * Layout priority per HLD §5, biggest to smallest: (1) `WorkoutGraph` `live`
 * — the dominant element, bottom-anchored, full width; (2) `WorkoutStepsList`
 * — compact upcoming-steps panel, left, in the band between dashboard and
 * graph; (3) `RideDashboard` — top, reused as-is (1 line phone / 2 lines
 * tablet, 2nd line = the workout shoutout on this screen only).
 *
 * Pure views are used throughout, not the smart wrappers, because the frames
 * are fixed-dp boxes, not the browser window (same reasoning as the 4.1 list
 * prototype): smart `RideDashboard` needs a live `ActivityRideService`
 * observer, and smart `WorkoutGraph`'s onLayout measurement doesn't resolve
 * under the react-native-web Storybook renderer — so the graph gets an
 * analytically computed pixel box instead (frame minus dashboard/steps
 * budget), the same "computed, not measured" approach `RideDashboardView`
 * itself uses for the shoutout width.
 *
 * Known story-only caveat: `RideDashboardView` reads `useWindowDimensions()`
 * (the real browser window) for its COMPACT column math, so the Phone
 * stories' dashboard only sizes correctly when the browser viewport matches
 * the frame (800×360) — screenshot verification does exactly that. Tablet
 * (non-compact) stories are unaffected (their column widths are fixed dp).
 */

// ---------------------------------------------------------------------------
// Mock data — two coherent snapshots of the SAME ~35min FTP-230 session the
// WorkoutGraph mocks model (warmup ramp → endurance → tempo → 3x VO2 on/off →
// cooldown). Steps/dashboard/title are hand-aligned to each snapshot's graph
// `position` so the three components tell one consistent story.
// ---------------------------------------------------------------------------

const dashboardItems = (time: string, distance: string, heartrate: string): ActivityDashboardItem[] => [
    // Workout rides keep Distance/Speed (device-calculated, HLD §5) but have
    // no Slope/Gear — there is no route. Secondary rows are deliberately
    // present: on tablet the shoutout line must REPLACE them (not join them),
    // on phone compact mode never shows them anyway.
    { title: 'Time', data: [{ value: time }, { value: '1:02:30', label: 'total' }] },
    { title: 'Distance', data: [{ value: distance, unit: 'km' }] },
    { title: 'Speed', data: [{ value: '32.4', unit: 'km/h' }, { value: '41.0', label: 'max' }] },
    { title: 'Power', data: [{ value: '278', unit: 'W' }, { value: '182', label: 'avg' }] },
    { title: 'Heartrate', data: [{ value: heartrate, unit: 'bpm' }, { value: '128', label: 'avg' }] },
    { title: 'Cadence', data: [{ value: '92', unit: 'rpm' }, { value: '88', label: 'avg' }] },
];

/**
 * Mid-workout: `position` 1050s — 150s into the 1st VO2 "on" step (900..1080,
 * 280W), so 30s remain. No skip yet: the current workout still equals the
 * pristine plan, `domain.x` = [0, 2100].
 */
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
        hasMore: true, // 3rd VO2 pair + cooldown lie beyond the 3 sent
    },
    dashboard: { text: '280W for 3min - VO2 max (1/3)', mode: 'ERG' },
    title: 'VO2 max (1/3)',
};

const MID_WORKOUT_ACTUALS: WorkoutGraphActuals = MOCK_ACTUALS_MID;

/**
 * Post-skip-back: the rider repeated the 3rd VO2 on/off pair, so the CURRENT
 * workout grew past the original plan — `domain.x` is [0, 2400] vs the
 * pristine [0, 2100] (a discrete jump, §3.0/§3.1). `position` 2250s sits
 * inside the shifted cooldown ramp (2100..2400), PAST the original plan's
 * end — renderable only because the domain grew. Last step, nothing upcoming:
 * the steps panel must show "Last step — end of workout".
 */
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

const AFTER_SKIP_BACK_ACTUALS: WorkoutGraphActuals = MOCK_ACTUALS_SKIPBACK;

// ---------------------------------------------------------------------------
// Prototype view
// ---------------------------------------------------------------------------

interface WorkoutRidePrototypeProps {
    displayProps: WorkoutRidePageDisplayProps;
    /** High-frequency overlay — arrives via getGraphActuals() in the real page (§4.5), never via page-update. */
    actuals: WorkoutGraphActuals;
    dashboardItems: ActivityDashboardItem[];
    /** Fixed device-frame size (dp). The graph's pixel box is computed from these. */
    frameWidth: number;
    frameHeight: number;
    /** Matches useScreenLayout()==='compact' (height < 420) — the real page derives this itself. */
    compact: boolean;
    /**
     * When set, renders the (already-existing, session 5.4) WorkoutSwipeFeedback
     * toast with this message on top of the layout — a frozen frame of the
     * moment right after a swipe fired, to judge its visibility in situ.
     */
    swipeFeedback?: string | null;
    onMenuOpen: () => void;
}

const GRAPH_MARGIN_H = 8;

// Graph height budget — the graph is the dominant element (HLD §5) and takes
// everything the dashboard + steps panel don't need, rather than a fixed share
// of the frame (review round 1: the fixed share left dead space between steps
// and graph on 10" and phone). Reserved = dashboard (+shoutout on tablet) +
// the steps panel at its fullest (previous + current + 3 upcoming + hint on
// tablet; current + 1 upcoming + hint compact) + margins. Analytic, not
// measured — same reasoning as everywhere else in this prototype.
const RESERVED_TABLET = 290;
const RESERVED_COMPACT = 160;

const WorkoutRidePrototypeView = (props: WorkoutRidePrototypeProps) => {
    const { displayProps, actuals, dashboardItems: items, frameWidth, frameHeight, compact, swipeFeedback, onMenuOpen } = props;

    const graphHeight = frameHeight - (compact ? RESERVED_COMPACT : RESERVED_TABLET);
    const graphWidth = frameWidth - GRAPH_MARGIN_H * 2;

    return (
        <View style={styles.page}>
            <View style={compact ? styles.dashboardCompact : styles.dashboardTablet}>
                <RideDashboardView
                    items={items}
                    layout="icon-left"
                    compact={compact}
                    workoutShoutout={displayProps.dashboard}
                />
            </View>

            {/* Middle band: steps panel left, Ride-Menu button right, the
                width between them free (the 5.4 full-screen swipe surface has
                no widget of its own). Clipped, not scrollable — if the steps
                list doesn't fit this band, that's a real finding, not
                something to hide. The Menu button can't reuse the GPX/Video
                bottom-bar slot (the WorkoutGraph owns the whole bottom here),
                so it mirrors the steps panel on the right — placement is a
                sign-off question. */}
            <View style={styles.middleBand}>
                <WorkoutStepsList
                    steps={displayProps.steps}
                    compact={compact}
                    style={compact ? styles.stepsCompact : styles.stepsTablet}
                />
                <View style={styles.middleSpacer} />
                <View style={compact ? styles.menuButtonCompact : styles.menuButtonTablet}>
                    <Button id="menu" label="Menu" primary={true} onClick={onMenuOpen} />
                </View>
            </View>

            <WorkoutGraphView
                width={graphWidth}
                height={graphHeight}
                mode="live"
                plan={displayProps.graph}
                actuals={actuals}
                showAxes={true}
                showFtpLine={true}
                style={styles.graph}
            />

            <WorkoutSwipeFeedback visible={!!swipeFeedback} message={swipeFeedback ?? ''} />
        </View>
    );
};

// ---------------------------------------------------------------------------
// Stories — fixed device frames (app is landscape-locked, see Loader.tsx),
// same frame set as the 4.1 list prototype: 10" = 1280×800, 7" = 1024×600,
// phone = 800×360 (height < 420 → compact).
// ---------------------------------------------------------------------------

const deviceFrame = (width: number, height: number) =>
    function DeviceFrame(Story: React.ComponentType) {
        return (
            <View style={[styles.deviceFrame, { width, height }]}>
                <Story />
            </View>
        );
    };

const TABLET_10 = deviceFrame(1280, 800);
const TABLET_7 = deviceFrame(1024, 600);
const PHONE = deviceFrame(800, 360);

const meta: Meta<typeof WorkoutRidePrototypeView> = {
    title: 'Pages/RidePage/WorkoutRidePrototype',
    component: WorkoutRidePrototypeView,
    args: {
        onMenuOpen: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutRidePrototypeView>;

const midWorkoutArgs = {
    displayProps: MID_WORKOUT,
    actuals: MID_WORKOUT_ACTUALS,
    dashboardItems: dashboardItems('0:17:30', '9.3', '162'),
};

const afterSkipBackArgs = {
    displayProps: AFTER_SKIP_BACK,
    actuals: AFTER_SKIP_BACK_ACTUALS,
    dashboardItems: dashboardItems('0:37:30', '19.8', '148'),
};

export const Tablet10MidWorkout: Story = {
    decorators: [TABLET_10],
    args: { ...midWorkoutArgs, frameWidth: 1280, frameHeight: 800, compact: false },
};

/** Same frame, after the skip-back — compare the graph's trailing x-tick (35:00 → 40:00). */
export const Tablet10AfterSkipBack: Story = {
    decorators: [TABLET_10],
    args: { ...afterSkipBackArgs, frameWidth: 1280, frameHeight: 800, compact: false },
};

export const Tablet7MidWorkout: Story = {
    decorators: [TABLET_7],
    args: { ...midWorkoutArgs, frameWidth: 1024, frameHeight: 600, compact: false },
};

export const Tablet7AfterSkipBack: Story = {
    decorators: [TABLET_7],
    args: { ...afterSkipBackArgs, frameWidth: 1024, frameHeight: 600, compact: false },
};

export const PhoneMidWorkout: Story = {
    decorators: [PHONE],
    args: { ...midWorkoutArgs, frameWidth: 800, frameHeight: 360, compact: true },
};

export const PhoneAfterSkipBack: Story = {
    decorators: [PHONE],
    args: { ...afterSkipBackArgs, frameWidth: 800, frameHeight: 360, compact: true },
};

/**
 * Frozen frame of the moment right after a swipe-up fired: the session-5.4
 * WorkoutSwipeFeedback toast ("+1%") over the full layout — exists to judge
 * whether the rider can actually see/distinguish the confirmation mid-ride.
 */
export const Tablet10SwipeFeedback: Story = {
    decorators: [TABLET_10],
    args: { ...midWorkoutArgs, frameWidth: 1280, frameHeight: 800, compact: false, swipeFeedback: '+1%' },
};

/** Same frozen swipe confirmation on the phone frame, with the wordier step-back message. */
export const PhoneSwipeFeedback: Story = {
    decorators: [PHONE],
    args: { ...midWorkoutArgs, frameWidth: 800, frameHeight: 360, compact: true, swipeFeedback: '◀ Step Back' },
};

const styles = StyleSheet.create({
    deviceFrame: {
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    page: {
        flex: 1,
        flexDirection: 'column',
        // Web-ui precedent: the desktop workout ride screen runs on a black
        // background, not the MainBackground photo — a workout-only ride has
        // no route visuals to show, and solid black maximises the contrast of
        // the graph's small axis/tick labels (review round 1).
        backgroundColor: '#000',
    },
    dashboardTablet: {
        alignItems: 'center',
        paddingTop: 4,
    },
    dashboardCompact: {
        alignSelf: 'stretch',
    },
    middleBand: {
        flex: 1,
        flexDirection: 'row',
        // Without this the row's default cross-axis 'stretch' pulls the steps
        // panel (and its translucent background) down to the graph edge.
        alignItems: 'flex-start',
        overflow: 'hidden',
    },
    stepsTablet: {
        width: 340,
        marginLeft: 12,
        marginTop: 8,
    },
    stepsCompact: {
        width: 260,
        marginLeft: 8,
        marginTop: 4,
    },
    middleSpacer: {
        flex: 1,
    },
    menuButtonTablet: {
        marginRight: 12,
        marginTop: 8,
    },
    menuButtonCompact: {
        marginRight: 8,
        marginTop: 4,
    },
    graph: {
        marginHorizontal: GRAPH_MARGIN_H,
        marginBottom: 4,
    },
});
