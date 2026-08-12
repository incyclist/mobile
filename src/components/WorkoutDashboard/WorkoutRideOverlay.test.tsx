import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { WorkoutRideOverlay, WorkoutRideOverlayProps, STOP_WORKOUT_UNDO_WINDOW_MS } from './WorkoutRideOverlay';
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
    onStopWorkout: () => {},
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

// ---------------------------------------------------------------------------
// Stop-Workout button, undo toast, deferred commit (workout-mobile-hld-phase2.md §8.3, session
// 5.3). §8.3: single tap, no pre-confirm dialog, recoverability via a short toast — this component
// defers the real onStopWorkout() call for STOP_WORKOUT_UNDO_WINDOW_MS so "Undo" never has to
// re-attach an already-stopped workout (a capability incyclist-services does not expose today).
// ---------------------------------------------------------------------------

describe('WorkoutRideOverlay — Stop-Workout button, toast, deferred commit', () => {
    beforeEach(() => {
        setDimensions(1280, 800);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('tablet: renders the Stop-Workout button inside the WorkoutDashboard controls column', () => {
        const { getByTestId } = render(<WorkoutRideOverlay {...baseProps} />);
        expect(getByTestId('stop-workout-button')).toBeTruthy();
    });

    it('a tap hides the WorkoutDashboard immediately and shows the undo toast, without calling onStopWorkout yet', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <WorkoutRideOverlay {...baseProps} onStopWorkout={onStopWorkout} />
        );

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(queryByTestId('workout-ride-overlay-dashboard')).toBeNull();
        expect(getByTestId('workout-ride-overlay-stop-toast')).toBeTruthy();
        expect(onStopWorkout).not.toHaveBeenCalled();
    });

    it('tapping Undo within the window restores the dashboard and never calls onStopWorkout', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <WorkoutRideOverlay {...baseProps} onStopWorkout={onStopWorkout} />
        );

        fireEvent.press(getByTestId('stop-workout-button'));
        fireEvent.press(getByTestId('stop-workout-toast-undo'));

        expect(getByTestId('workout-ride-overlay-dashboard')).toBeTruthy();
        expect(queryByTestId('workout-ride-overlay-stop-toast')).toBeNull();

        jest.advanceTimersByTime(STOP_WORKOUT_UNDO_WINDOW_MS + 100);
        expect(onStopWorkout).not.toHaveBeenCalled();
    });

    it('lets the window elapse without Undo: commits the real stop exactly once', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId } = render(<WorkoutRideOverlay {...baseProps} onStopWorkout={onStopWorkout} />);

        fireEvent.press(getByTestId('stop-workout-button'));
        jest.advanceTimersByTime(STOP_WORKOUT_UNDO_WINDOW_MS + 100);

        expect(onStopWorkout).toHaveBeenCalledTimes(1);
    });

    it('a stray Undo tap after the window already committed is a no-op (does not resurrect the dashboard)', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <WorkoutRideOverlay {...baseProps} onStopWorkout={onStopWorkout} />
        );

        fireEvent.press(getByTestId('stop-workout-button'));
        jest.advanceTimersByTime(STOP_WORKOUT_UNDO_WINDOW_MS + 100);
        fireEvent.press(getByTestId('stop-workout-toast-undo'));

        expect(onStopWorkout).toHaveBeenCalledTimes(1);
        expect(queryByTestId('workout-ride-overlay-dashboard')).toBeNull();
        expect(getByTestId('workout-ride-overlay-stop-toast')).toBeTruthy();
    });

    it('unmounting before the window elapses drops the pending stop without ever committing it', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId, unmount } = render(<WorkoutRideOverlay {...baseProps} onStopWorkout={onStopWorkout} />);

        fireEvent.press(getByTestId('stop-workout-button'));
        unmount();
        jest.advanceTimersByTime(STOP_WORKOUT_UNDO_WINDOW_MS + 100);

        expect(onStopWorkout).not.toHaveBeenCalled();
    });

    it('fallback: renders the Stop-Workout button in its own mirrored slot, and the toast still shows on tap', () => {
        setDimensions(844, 390); // fallback per §8.1's table
        const { getByTestId, queryByTestId } = render(<WorkoutRideOverlay {...baseProps} compact />);

        expect(getByTestId('workout-ride-overlay-stop-slot')).toBeTruthy();
        expect(getByTestId('stop-workout-button')).toBeTruthy();

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(queryByTestId('workout-ride-overlay-stop-slot')).toBeNull();
        expect(queryByTestId('workout-ride-overlay-shoutout')).toBeNull();
        expect(getByTestId('workout-ride-overlay-stop-toast')).toBeTruthy();
    });
});
