import React from 'react';
import { render } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

const mockStartRideDisplay = jest.fn();
const mockWorkoutRideOverlay = jest.fn();
jest.mock('../../../components', () => ({
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    ElevationGraph: () => null,
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

const mockUseScreenLayout = jest.fn(() => 'normal');
jest.mock('../../../hooks', () => ({
    useScreenLayout: () => mockUseScreenLayout(),
}));

jest.mock('../../../components/StreetView', () => ({ StreetView: () => null }));

const baseProps: GPXTourPageViewProps = {
    displayProps: {
        startOverlayProps: {
            devices: [
                { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
                { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
            ],
            rideState: 'Starting',
            readyToStart: true,
        },
        menuProps: null,
        rideView: 'map',
        route: undefined,
        displayObserver: undefined,
    } as any,
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

const activeRouteProps = {
    hasGpx: true,
    points: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
};

const activeProps = (rideView: 'map' | 'sat' | 'sv'): GPXTourPageViewProps => ({
    ...baseProps,
    displayProps: {
        ...baseProps.displayProps,
        startOverlayProps: null,
        rideView,
        route: {
            description: { hasGpx: activeRouteProps.hasGpx, isLoop: false },
            details: { points: activeRouteProps.points },
        },
    } as any,
});

describe('GPXTourPageView — start overlay "Start" button wiring', () => {
    beforeEach(() => {
        mockStartRideDisplay.mockClear();
    });

    it('wires the Start button to a handler that actually starts the ride (ignoring failed sensors), not a no-op', () => {
        const onIgnoreStart = jest.fn();
        render(<GPXTourPageView {...baseProps} onIgnoreStart={onIgnoreStart} />);

        expect(mockStartRideDisplay).toHaveBeenCalled();
        const props = mockStartRideDisplay.mock.calls.at(-1)?.[0];

        // Pressing "Start" when ready must proceed the ride (same action as "Ignore" sensors),
        // not silently do nothing.
        props.onStart();
        expect(onIgnoreStart).toHaveBeenCalled();
    });
});

describe('GPXTourPageView — corner orientation map', () => {
    beforeEach(() => {
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('shows the corner map when the main view is StreetView', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sv')} />);
        expect(queryByTestId('gpx-corner-map')).not.toBeNull();
    });

    it('does not show the corner map when the main view is the Map', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('map')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map when the main view is Satellite (still rendered as a full-screen map today)', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sat')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map in compact mode, even in StreetView', () => {
        mockUseScreenLayout.mockReturnValue('compact');
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sv')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map when there is no GPX route data', () => {
        const props = activeProps('sv');
        (props.displayProps as any).route = {
            description: { hasGpx: false, isLoop: false },
            details: { points: [] },
        };
        const { queryByTestId } = render(<GPXTourPageView {...props} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Workout overlay branch (workout-mobile-hld-phase2.md §5/§9.1, session 5.1) — additive,
// prop-driven, gated on displayProps.workoutAttached && the caller-supplied `comboEnabled` prop
// (hasFeature('MOBILE_WORKOUT_ROUTE_COMBO'), read one layer up by GPXTourPage — session 2.2/3.3's
// established pattern, kept out of this pure view so it's directly prop-testable). Route-only
// rendering (including the corner-map tests above) must be bit-for-bit unaffected.
// ---------------------------------------------------------------------------

const comboDisplayProps = () => ({
    ...activeProps('sv').displayProps,
    workoutAttached: true,
    graph: { bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0], y: [0, 0] } },
    steps: { previous: null, current: null, upcoming: [], hasMore: false },
    dashboard: { text: '260W - VO2 max (3/5)', mode: null },
});

describe('GPXTourPageView — workout overlay branch', () => {
    beforeEach(() => {
        mockWorkoutRideOverlay.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('does not render the overlay for a route-only ride, regardless of the toggle', () => {
        const { queryByText } = render(<GPXTourPageView {...activeProps('sv')} comboEnabled={true} />);
        expect(queryByText('workout-ride-overlay')).toBeNull();
        expect(mockWorkoutRideOverlay).not.toHaveBeenCalled();
    });

    it('does not render the overlay when a workout is attached but the toggle is off', () => {
        const { queryByText } = render(
            <GPXTourPageView {...baseProps} comboEnabled={false} displayProps={comboDisplayProps() as any} />
        );
        expect(queryByText('workout-ride-overlay')).toBeNull();
        expect(mockWorkoutRideOverlay).not.toHaveBeenCalled();
    });

    it('renders the overlay when a workout is attached AND the toggle is on, and suppresses the route-only corner map', () => {
        const { getByText, queryByTestId } = render(
            <GPXTourPageView {...baseProps} comboEnabled={true} displayProps={comboDisplayProps() as any} />
        );
        expect(getByText('workout-ride-overlay')).toBeTruthy();
        // The old corner-map element is suppressed — WorkoutRideOverlay owns corner-widget
        // placement once combo is active (not a double-render of the same widget).
        expect(queryByTestId('gpx-corner-map')).toBeNull();

        const overlayProps = mockWorkoutRideOverlay.mock.calls[0][0];
        expect(overlayProps.graph).toEqual({ bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0], y: [0, 0] } });
        expect(overlayProps.mapVisible).toBe(true); // StreetView main view + GPX route data present
    });

    it('forwards onStopWorkout through to the overlay unchanged (workout-mobile-hld-phase2.md §8.3, session 5.3)', () => {
        const onStopWorkout = jest.fn();
        render(
            <GPXTourPageView
                {...baseProps}
                comboEnabled={true}
                displayProps={comboDisplayProps() as any}
                onStopWorkout={onStopWorkout}
            />
        );
        const overlayProps = mockWorkoutRideOverlay.mock.calls[0][0];
        expect(overlayProps.onStopWorkout).toBe(onStopWorkout);
    });
});
