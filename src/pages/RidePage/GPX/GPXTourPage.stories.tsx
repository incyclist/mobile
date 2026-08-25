import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GPXTourPageView } from './View';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../../../components/WorkoutDashboard/WorkoutDashboard.mock';

import sydneyRoute from '../../../../__tests__/testdata/sydney.json';


const meta: Meta<typeof GPXTourPageView> = {
    component: GPXTourPageView,
    title: 'Pages/GPXTourPage',
    args: {
        onMenuOpen: fn(),
        onMenuClose: fn(),
        onRetryStart: fn(),
        onIgnoreStart: fn(),
        onCancelStart: fn(),
        getGraphActuals: () => MOCK_DASHBOARD_MID_INTERVAL.actuals ?? { power: [], heartrate: [], position: 0 },
        onToggleCornerWidget: fn(),
        onStopWorkout: fn(),
        onExpandPrevRides: fn(),
        onCollapsePrevRides: fn(),
        onSetPrevRidesVisibleRows: fn(),
        onSetPrevRidesMode: fn(),
        getPrevRidesRows: () => [],
    },
};

export default meta;

type Story = StoryObj<typeof GPXTourPageView>;


export const WithStartOverlay: Story = {
    args: {
        displayProps: {
            rideState: 'Starting',
            rideType: 'GPX',
            menuProps: null,
            startGateProps: null,
            startOverlayProps: {
                mode: 'GPX',
                rideState: 'Starting',
                mapType: 'MapView',
                mapState: 'Loaded',
                devices: [
                    { udid: '1', name: 'Smart Trainer', isControl: true, status: 'Starting', capabilities: ['control'] },
                ],
                readyToStart: false,
               
            },
        },
    },
};

export const ActiveRide: Story = {
    args: {
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'GPX',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            rideView:'map'  as any,
        },
    },
};

// GPX route shaped with description/details (route.description.hasGpx + route.details.points),
// used to exercise the corner orientation map (§1.3.1 of ride-overlay-layout-design.md).
const gpxRoute = {
    description: { hasGpx: true, isLoop: false },
    details: { points: (sydneyRoute as any).points },
};

export const StreetViewWithCornerMap: Story = {
    args: {
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'GPX',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: gpxRoute as any,
            rideView: 'sv' as any,
        },
    },
};

export const MapNoCornerMap: Story = {
    args: {
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'GPX',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: gpxRoute as any,
            rideView: 'map' as any,
        },
    },
};

// ---------------------------------------------------------------------------
// Workout overlay (session 5.1 — workout-mobile-hld-phase2.md §5). Real `RideOverlay`
// via `useRideOverlayLayout()`, so the arrangement (block-side/t-side/column-only/fallback) tracks
// whichever Storybook viewport is active — resize the toolbar viewport picker to see it re-decide,
// same as `Components/RideOverlay` does directly.
// ---------------------------------------------------------------------------

const comboDisplayProps = {
    rideState: 'Active' as const,
    rideType: 'GPX' as const,
    startOverlayProps: null,
    startGateProps: null,
    menuProps: null,
    route: gpxRoute as any,
    rideView: 'sv' as any,
    workoutAttached: true,
    graph: MOCK_DASHBOARD_MID_INTERVAL.graph,
    steps: MOCK_DASHBOARD_MID_INTERVAL.steps,
    dashboard: MOCK_DASHBOARD_MID_INTERVAL.line,
};

/** Workout attached — the new overlay renders and owns the corner-widget slots (the plain
 *  StreetView corner map above is suppressed, not double-rendered). */
export const WorkoutOverlayActive: Story = {
    args: {
        rideObserver: null,
        displayProps: comboDisplayProps as any,
    },
};

/** Phone-landscape viewport — pick a "phone" preset in the toolbar to see the fallback arrangement
 *  (2-way Elevation/Workout corner toggle) instead of block-side/t-side. */
export const WorkoutOverlayFallback: Story = {
    args: {
        rideObserver: null,
        displayProps: { ...comboDisplayProps, cornerWidget: 'elevation' } as any,
    },
    parameters: {
        viewport: { defaultViewport: 's23Ultra' },
    },
};
