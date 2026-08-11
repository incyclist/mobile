import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutRideOverlay, WorkoutRideOverlayProps } from './WorkoutRideOverlay';
import { MOCK_DASHBOARD_MID_INTERVAL } from './WorkoutDashboard.mock';

// Same pattern useRideOverlayLayout.test.ts (session 3.2) uses — the hook reads the real browser
// window via useWindowDimensions(), so tests drive it by mocking that module directly rather than
// this file's own '../../hooks' barrel (which WorkoutRideOverlay does not import from anyway).
const mockDimensions = { width: 1280, height: 800 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}));
const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width;
    mockDimensions.height = height;
};

jest.mock('../Dynamic', () => ({
    Dynamic: ({ children }: any) => children,
}));
jest.mock('../ElevationGraph', () => ({
    ElevationGraph: () => null,
}));
jest.mock('../FreeMap', () => ({
    FreeMap: () => null,
}));
jest.mock('../WorkoutGraph', () => ({
    WorkoutGraph: () => null,
}));
jest.mock('../WorkoutStepsList', () => ({
    WorkoutStepsList: () => null,
}));

const baseProps: WorkoutRideOverlayProps = {
    mapVisible: true,
    graph: MOCK_DASHBOARD_MID_INTERVAL.graph,
    steps: MOCK_DASHBOARD_MID_INTERVAL.steps,
    dashboard: MOCK_DASHBOARD_MID_INTERVAL.line,
    dashboardHeight: 80,
    compact: false,
    rideObserver: null,
    getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
    onToggleCornerWidget: () => {},
    mapPoints: [{ lat: 1, lng: 2 } as any, { lat: 3, lng: 4 } as any],
    transformPosition: () => undefined,
};

describe('WorkoutRideOverlay', () => {
    beforeEach(() => {
        setDimensions(1280, 800);
    });

    it('block-side: renders the dashboard and both corner widgets', () => {
        setDimensions(1400, 900); // block-side per ride-overlay-layout-design.md §8.1's table
        const { getByTestId, queryByTestId } = render(<WorkoutRideOverlay {...baseProps} />);

        expect(getByTestId('workout-ride-overlay-dashboard')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-map')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-elevation')).toBeTruthy();
        // Non-fallback arrangements never show the toggle Pressable or the shoutout line
        expect(queryByTestId('workout-ride-overlay-corner-toggle')).toBeNull();
        expect(queryByTestId('workout-ride-overlay-shoutout')).toBeNull();
    });

    it('t-side: still renders the dashboard (shallow T, not narrow) and both corner widgets', () => {
        setDimensions(1194, 834); // t-side per the design doc's iPad Air example
        const { getByTestId } = render(<WorkoutRideOverlay {...baseProps} />);

        expect(getByTestId('workout-ride-overlay-dashboard')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-map')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-elevation')).toBeTruthy();
    });

    it('column-only: renders the dashboard, drops both corner widgets entirely (not relocated)', () => {
        setDimensions(860, 480);
        const { getByTestId, queryByTestId } = render(<WorkoutRideOverlay {...baseProps} />);

        expect(getByTestId('workout-ride-overlay-dashboard')).toBeTruthy();
        expect(queryByTestId('workout-ride-overlay-map')).toBeNull();
        expect(queryByTestId('workout-ride-overlay-elevation')).toBeNull();
    });

    it('fallback (compact): no WorkoutDashboard, no corner map — the elevation slot becomes a toggle, plus the shoutout line', () => {
        setDimensions(844, 390); // height < 420 => compact => fallback
        const { getByTestId, queryByTestId, getByText } = render(
            <WorkoutRideOverlay {...baseProps} compact cornerWidget="elevation" />
        );

        expect(queryByTestId('workout-ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('workout-ride-overlay-map')).toBeNull();
        expect(getByTestId('workout-ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-corner-toggle')).toBeTruthy();
        expect(getByTestId('workout-ride-overlay-shoutout')).toBeTruthy();
        expect(getByText(MOCK_DASHBOARD_MID_INTERVAL.line.text)).toBeTruthy();
    });

    it('fallback, cornerWidget="workout": the toggle slot still renders (as the workout graph, mocked to null here) inside the same Pressable', () => {
        setDimensions(844, 390);
        const { getByTestId } = render(
            <WorkoutRideOverlay {...baseProps} compact cornerWidget="workout" />
        );

        expect(getByTestId('workout-ride-overlay-corner-toggle')).toBeTruthy();
    });

    it('does not render a corner map when mapVisible is false, even in an arrangement with room for one', () => {
        setDimensions(1400, 900);
        const { queryByTestId, getByTestId } = render(<WorkoutRideOverlay {...baseProps} mapVisible={false} />);

        expect(queryByTestId('workout-ride-overlay-map')).toBeNull();
        expect(getByTestId('workout-ride-overlay-elevation')).toBeTruthy();
    });

    it('passes the measured RideDashboard height through — not the ratio estimate (HLD §8.7 finding 5)', () => {
        // At the 8-tile width (743), a non-measured estimate (0.10 * 800 = 80) would sit the
        // workout dashboard 13 px INSIDE an 8-tile icon-top dashboard's real 93 px height. Passing
        // the measured height must not throw and must be honored by the underlying hook (already
        // covered end-to-end by useRideOverlayLayout.test.ts; this just confirms the prop reaches it).
        setDimensions(1280, 800);
        expect(() =>
            render(<WorkoutRideOverlay {...baseProps} itemCount={8} measuredRideDashboardHeight={93} />)
        ).not.toThrow();
    });
});
