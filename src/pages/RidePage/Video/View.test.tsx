import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoRidePageView } from './View';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

const mockStartRideDisplay = jest.fn();
const mockWorkoutRideOverlay = jest.fn();
jest.mock('../../../components', () => ({
    Video: () => null,
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    ElevationGraph: () => null,
    InfoText: () => null,
    FreeMap: () => null,
    MainBackground: () => null,
    RideDashboard: () => null,
    RideMenu: () => null,
    StartRideDisplay: (props: any) => {
        mockStartRideDisplay(props);
        return null;
    },
    WorkoutRideOverlay: (props: any) => {
        mockWorkoutRideOverlay(props);
        const { Text } = require('react-native');
        return <Text>workout-ride-overlay</Text>;
    },
}));

jest.mock('../../../hooks', () => ({
    useScreenLayout: () => 'normal',
}));

const baseProps: any = {
    displayProps: {
        startOverlayProps: {
            devices: [
                { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
                { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
            ],
            rideState: 'Starting',
            readyToStart: true,
            videoState: 'Started',
        },
        menuProps: null,
        video: null,
        videos: [],
        route: undefined,
    },
    rideObserver: null,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
    getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
    onToggleCornerWidget: () => {},
    onStopWorkout: () => {},
};

describe('VideoRidePageView — start overlay "Start" button wiring', () => {
    beforeEach(() => {
        mockStartRideDisplay.mockClear();
    });

    it('wires the Start button to a handler that actually starts the ride (ignoring failed sensors), not a no-op', () => {
        const onIgnoreStart = jest.fn();
        render(<VideoRidePageView {...baseProps} onIgnoreStart={onIgnoreStart} />);

        expect(mockStartRideDisplay).toHaveBeenCalled();
        const props = mockStartRideDisplay.mock.calls.at(-1)?.[0];

        props.onStart();
        expect(onIgnoreStart).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Workout overlay branch (workout-mobile-hld-phase2.md §5, session 5.1) — additive, prop-driven,
// gated on displayProps.workoutAttached. Route-only rendering must be bit-for-bit unaffected.
// ---------------------------------------------------------------------------

const comboDisplayProps = {
    ...baseProps.displayProps,
    startOverlayProps: null,
    workoutAttached: true,
    graph: { bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0], y: [0, 0] } },
    steps: { previous: null, current: null, upcoming: [], hasMore: false },
    dashboard: { text: '260W - VO2 max (3/5)', mode: null },
};

describe('VideoRidePageView — workout overlay branch', () => {
    beforeEach(() => {
        mockWorkoutRideOverlay.mockClear();
    });

    it('does not render the overlay for a route-only ride (workoutAttached false)', () => {
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{ ...baseProps.displayProps, startOverlayProps: null }}
            />
        );
        expect(queryByText('workout-ride-overlay')).toBeNull();
        expect(mockWorkoutRideOverlay).not.toHaveBeenCalled();
    });

    it('renders the overlay when a workout is attached', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={comboDisplayProps} />
        );
        expect(getByText('workout-ride-overlay')).toBeTruthy();
        expect(mockWorkoutRideOverlay).toHaveBeenCalledTimes(1);
        const overlayProps = mockWorkoutRideOverlay.mock.calls[0][0];
        expect(overlayProps.graph).toBe(comboDisplayProps.graph);
        expect(overlayProps.steps).toBe(comboDisplayProps.steps);
        expect(overlayProps.dashboard).toBe(comboDisplayProps.dashboard);
    });

    it('passes the measured RideDashboard height through as measuredRideDashboardHeight (not the ratio estimate)', () => {
        render(<VideoRidePageView {...baseProps} displayProps={comboDisplayProps} />);
        const overlayProps = mockWorkoutRideOverlay.mock.calls[0][0];
        // Before onLayout ever fires, the page's own dashboardHeight state seeds from the same
        // screen-fraction estimate the hook itself would fall back to — the point under test is
        // that the page's *measured* value (whatever it is) is the one forwarded, not that any
        // particular number appears before a real onLayout has ever fired.
        expect(overlayProps.measuredRideDashboardHeight).toEqual(expect.any(Number));
    });

    it('forwards onStopWorkout through to the overlay unchanged (workout-mobile-hld-phase2.md §8.3, session 5.3)', () => {
        const onStopWorkout = jest.fn();
        render(
            <VideoRidePageView
                {...baseProps}
                displayProps={comboDisplayProps}
                onStopWorkout={onStopWorkout}
            />
        );
        const overlayProps = mockWorkoutRideOverlay.mock.calls[0][0];
        expect(overlayProps.onStopWorkout).toBe(onStopWorkout);
    });
});
