import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { VideoRidePageView } from './View';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../../../components/WorkoutDashboard/WorkoutDashboard.mock';

import sydneyRoute from '../../../../__tests__/testdata/sydney.json';

/**
 * The real, shipped `VideoRidePageView` (session 5.1) — specifically to exercise the workout
 * overlay branch (`workout-mobile-hld-phase2.md` §5/§9.1), which the hand-maintained
 * `Pages/VideoRidePage` group (`VideoRidePageTestView`, a pre-existing photographic mock
 * predating this feature) doesn't render at all. `video.src` is intentionally empty here — these
 * stories are not about video playback, only about the combo overlay/arrangement on top of it.
 */
const meta: Meta<typeof VideoRidePageView> = {
    component: VideoRidePageView,
    title: 'Pages/VideoRidePage/Workout overlay (real view)',
    args: {
        onMenuOpen: fn(),
        onMenuClose: fn(),
        onCloseRidePage: fn(),
        onRetryStart: fn(),
        onIgnoreStart: fn(),
        onCancelStart: fn(),
        getGraphActuals: () => MOCK_DASHBOARD_MID_INTERVAL.actuals ?? { power: [], heartrate: [], position: 0 },
        onToggleCornerWidget: fn(),
        rideObserver: null,
    },
};

export default meta;

type Story = StoryObj<typeof VideoRidePageView>;

// GPX-shaped route data reused for its corner-map-eligible points (hasGpx + details.points) —
// same fixture GPXTourPage.stories.tsx's combo stories use.
const gpxRoute = {
    description: { hasGpx: true, isLoop: false },
    details: { points: (sydneyRoute as any).points },
};

const comboDisplayProps = {
    rideState: 'Active' as const,
    rideType: 'Video' as const,
    startOverlayProps: null,
    startGateProps: null,
    menuProps: null,
    route: gpxRoute as any,
    video: { src: '', hidden: false } as any,
    workoutAttached: true,
    graph: MOCK_DASHBOARD_MID_INTERVAL.graph,
    steps: MOCK_DASHBOARD_MID_INTERVAL.steps,
    dashboard: MOCK_DASHBOARD_MID_INTERVAL.line,
};

/** Workout attached + combo toggle on — the overlay renders and owns the corner-widget slots
 *  (the plain 2km elevation preview/map overlay above are suppressed, not double-rendered). */
export const WorkoutOverlayActive: Story = {
    args: {
        comboEnabled: true,
        displayProps: comboDisplayProps as any,
    },
};

/** Same attached workout, toggle off — must render byte-for-byte like a plain Video ride
 *  (regression guard: the "always-off correctness" case §9.1 makes non-negotiable during rollout). */
export const WorkoutAttachedToggleOff: Story = {
    args: {
        comboEnabled: false,
        displayProps: comboDisplayProps as any,
    },
};

/** Phone-landscape viewport — pick a "phone" preset in the toolbar to see the fallback arrangement
 *  (2-way Elevation/Workout corner toggle) instead of block-side/t-side. */
export const WorkoutOverlayFallback: Story = {
    args: {
        comboEnabled: true,
        displayProps: { ...comboDisplayProps, cornerWidget: 'elevation' } as any,
    },
    parameters: {
        viewport: { defaultViewport: 's23Ultra' },
    },
};
