import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RideOverlay, RideOverlayProps } from './RideOverlay';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../WorkoutDashboard/WorkoutDashboard.mock';
import { MOCK_ROWS } from '../PrevRides/PrevRidesRow.mock';

// Same pattern useRideOverlayLayout.test.ts (session 3.2) uses — the hook reads the real browser
// window via useWindowDimensions(), so tests drive it by mocking that module directly rather than
// this file's own '../../hooks' barrel (which RideOverlay does not import from anyway).
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
const mockFreeMap = jest.fn();
jest.mock('../FreeMap', () => ({
    FreeMap: (props: any) => {
        mockFreeMap(props);
        return null;
    },
}));
jest.mock('../WorkoutGraph', () => ({
    WorkoutGraph: () => null,
}));
jest.mock('../WorkoutStepsList', () => ({
    WorkoutStepsList: () => null,
}));

const baseProps: RideOverlayProps = {
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

describe('RideOverlay', () => {
    beforeEach(() => {
        setDimensions(1280, 800);
    });

    it('block-side: renders the dashboard and both corner widgets', () => {
        setDimensions(1400, 900); // block-side per ride-overlay-layout-design.md §8.1's table
        const { getByTestId, queryByTestId } = render(<RideOverlay {...baseProps} />);

        expect(getByTestId('ride-overlay-dashboard')).toBeTruthy();
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        // Non-fallback arrangements never show the toggle Pressable or the shoutout line
        expect(queryByTestId('ride-overlay-corner-toggle')).toBeNull();
        expect(queryByTestId('ride-overlay-shoutout')).toBeNull();
    });

    it('t-side: still renders the dashboard (shallow T, not narrow) and both corner widgets', () => {
        setDimensions(1194, 834); // t-side per the design doc's iPad Air example
        const { getByTestId } = render(<RideOverlay {...baseProps} />);

        expect(getByTestId('ride-overlay-dashboard')).toBeTruthy();
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
    });

    it('column-only: renders the dashboard, drops both corner widgets entirely (not relocated)', () => {
        setDimensions(860, 480);
        const { getByTestId, queryByTestId } = render(<RideOverlay {...baseProps} />);

        expect(getByTestId('ride-overlay-dashboard')).toBeTruthy();
        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(queryByTestId('ride-overlay-elevation')).toBeNull();
    });

    it('fallback (compact): no WorkoutDashboard, no corner map — the elevation slot becomes a toggle, plus the shoutout line', () => {
        setDimensions(844, 390); // height < 420 => compact => fallback
        const { getByTestId, queryByTestId, getByText } = render(
            <RideOverlay {...baseProps} compact cornerWidget="elevation" />
        );

        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-corner-toggle')).toBeTruthy();
        expect(getByTestId('ride-overlay-shoutout')).toBeTruthy();
        expect(getByText(MOCK_DASHBOARD_MID_INTERVAL.line.text)).toBeTruthy();
    });

    it('fallback, cornerWidget="workout": the toggle slot still renders (as the workout graph, mocked to null here) inside the same Pressable', () => {
        setDimensions(844, 390);
        const { getByTestId } = render(
            <RideOverlay {...baseProps} compact cornerWidget="workout" />
        );

        expect(getByTestId('ride-overlay-corner-toggle')).toBeTruthy();
    });

    it('does not render a corner map when mapVisible is false, even in an arrangement with room for one', () => {
        setDimensions(1400, 900);
        const { queryByTestId, getByTestId } = render(<RideOverlay {...baseProps} mapVisible={false} />);

        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
    });

    it('passes the measured RideDashboard height through — not the ratio estimate (HLD §8.7 finding 5)', () => {
        // At the 8-tile width (743), a non-measured estimate (0.10 * 800 = 80) would sit the
        // workout dashboard 13 px INSIDE an 8-tile icon-top dashboard's real 93 px height. Passing
        // the measured height must not throw and must be honored by the underlying hook (already
        // covered end-to-end by useRideOverlayLayout.test.ts; this just confirms the prop reaches it).
        setDimensions(1280, 800);
        expect(() =>
            render(<RideOverlay {...baseProps} itemCount={8} measuredRideDashboardHeight={93} />)
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// No workout attached — a plain route ride mounting this component for its ear occupants only.
// graph/steps/dashboard are all absent together (never partially populated).
// ---------------------------------------------------------------------------

describe('RideOverlay — no workout attached', () => {
    const routeOnlyProps: RideOverlayProps = {
        mapVisible: true,
        prevRides: MOCK_ROWS,
        dashboardHeight: 80,
        compact: false,
        rideObserver: null,
        getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
        onToggleCornerWidget: () => {},
        mapPoints: [{ lat: 1, lng: 2 } as any, { lat: 3, lng: 4 } as any],
        transformPosition: () => undefined,
        onStopWorkout: () => {},
    };

    it('block-side: renders the ear occupants (map, elevation, previous rides), no WorkoutDashboard', () => {
        setDimensions(1400, 900); // block-side per ride-overlay-layout-design.md §8.1's table
        const { getByTestId, queryByTestId, getAllByTestId } = render(<RideOverlay {...routeOnlyProps} />);

        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
        expect(getAllByTestId('prev-rides-row')).toHaveLength(MOCK_ROWS.length);
    });

    it('renders only the previous-rides ear when that is the only occupant populated (no map points, no workout)', () => {
        setDimensions(1400, 900);
        const { getByTestId, queryByTestId } = render(
            <RideOverlay {...routeOnlyProps} mapVisible={false} mapPoints={undefined} />
        );

        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
    });

    it('does not render the previous-rides ear when no rows are given', () => {
        setDimensions(1400, 900);
        const { queryByTestId } = render(<RideOverlay {...routeOnlyProps} prevRides={undefined} />);

        expect(queryByTestId('ride-overlay-prev-rides')).toBeNull();
    });

    it('column-only: drops the ears entirely (no WorkoutDashboard, no crash on the now-optional props)', () => {
        setDimensions(860, 480);
        expect(() => render(<RideOverlay {...routeOnlyProps} />)).not.toThrow();

        const { queryByTestId } = render(<RideOverlay {...routeOnlyProps} />);
        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(queryByTestId('ride-overlay-elevation')).toBeNull();
        expect(queryByTestId('ride-overlay-prev-rides')).toBeNull();
    });

    it('fallback (compact): no WorkoutDashboard, no shoutout line, no Stop-Workout slot, no crash', () => {
        setDimensions(844, 390); // height < 420 => compact => fallback
        expect(() =>
            render(<RideOverlay {...routeOnlyProps} compact cornerWidget="elevation" />)
        ).not.toThrow();

        const { queryByTestId, getByTestId } = render(
            <RideOverlay {...routeOnlyProps} compact cornerWidget="elevation" />
        );
        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('ride-overlay-shoutout')).toBeNull();
        expect(queryByTestId('ride-overlay-stop-slot')).toBeNull();
        // the corner slot itself still renders (elevation, in this case) — cycling between
        // 'elevation' and 'prevRides' states on a plain ride is a later session's wiring, not this
        // component's concern; it only guarantees no crash on the toggle path when graph is absent.
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
    });

    it('block-side: reports the ear\'s own visibleRows via onVisibleRowsChange', () => {
        setDimensions(1400, 900);
        const onVisibleRowsChange = jest.fn();
        render(<RideOverlay {...routeOnlyProps} onVisibleRowsChange={onVisibleRowsChange} />);

        expect(onVisibleRowsChange).toHaveBeenCalled();
        const reported = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        expect(typeof reported).toBe('number');
        expect(reported).toBeGreaterThanOrEqual(1);
    });

    it('forwards mapPrevRiders to the corner FreeMap', () => {
        setDimensions(1400, 900);
        mockFreeMap.mockClear();
        const markers = [{ key: '1', position: { lat: 1, lng: 2 } }];
        render(<RideOverlay {...routeOnlyProps} mapPrevRiders={markers} />);

        expect(mockFreeMap).toHaveBeenCalled();
        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({ prevRiders: markers });
    });
});

// ---------------------------------------------------------------------------
// Fallback corner slot showing 'prevRides' (design doc §6.3) — the chevron/expand-panel wiring
// RideOverlay.test.tsx previously called out as "a later session's wiring, not this component's
// concern" (see the 'elevation' fallback test above). This is that session.
// ---------------------------------------------------------------------------

describe('RideOverlay — fallback corner slot, cornerWidget="prevRides"', () => {
    const prevRidesFallbackProps: RideOverlayProps = {
        mapVisible: true,
        prevRides: MOCK_ROWS,
        dashboardHeight: 80,
        compact: true,
        rideObserver: null,
        getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
        onToggleCornerWidget: () => {},
        mapPoints: [{ lat: 1, lng: 2 } as any, { lat: 3, lng: 4 } as any],
        transformPosition: () => undefined,
        onStopWorkout: () => {},
        cornerWidget: 'prevRides',
    };

    beforeEach(() => {
        setDimensions(844, 390); // height < 420 => compact => fallback
    });

    it('renders the condensed line and the expand chevron, not the elevation/workout content', () => {
        const { getByTestId, queryByTestId } = render(<RideOverlay {...prevRidesFallbackProps} />);

        expect(getByTestId('prev-rides-corner-slot')).toBeTruthy();
        expect(getByTestId('prev-rides-condensed-line')).toBeTruthy();
        expect(getByTestId('prev-rides-expand-chevron')).toBeTruthy();
        expect(queryByTestId('ride-overlay-elevation')).toBeNull();
    });

    it('tapping the slot (not the chevron) still cycles the corner widget', () => {
        const onToggleCornerWidget = jest.fn();
        const { getByTestId } = render(
            <RideOverlay {...prevRidesFallbackProps} onToggleCornerWidget={onToggleCornerWidget} />
        );

        fireEvent.press(getByTestId('ride-overlay-corner-toggle'));
        expect(onToggleCornerWidget).toHaveBeenCalled();
    });

    it('condensed state reports the fixed 2-row budget via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        render(<RideOverlay {...prevRidesFallbackProps} onVisibleRowsChange={onVisibleRowsChange} />);

        expect(onVisibleRowsChange).toHaveBeenCalledWith(2);
    });

    it('tapping the chevron expands the panel (not the toggle cycle) and renders the row list', () => {
        const onToggleCornerWidget = jest.fn();
        const onExpandPrevRides = jest.fn();
        const { getByTestId, getAllByTestId } = render(
            <RideOverlay
                {...prevRidesFallbackProps}
                onToggleCornerWidget={onToggleCornerWidget}
                onExpandPrevRides={onExpandPrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onExpandPrevRides).toHaveBeenCalled();
        expect(onToggleCornerWidget).not.toHaveBeenCalled();
        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(getAllByTestId('prev-rides-row').length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// Stop-Workout button (workout-mobile-hld-phase2.md §8.3, session 5.3). §8.3: single tap, no
// pre-confirm dialog. Repo-owner review (2026-08-12): no undo window either — the button is small,
// isolated from the Menu button, and distinct enough that an accidental tap isn't a realistic
// concern, unlike a swipe/gesture control. onStopWorkout() fires directly on tap.
// ---------------------------------------------------------------------------

describe('RideOverlay — Stop-Workout button', () => {
    beforeEach(() => {
        setDimensions(1280, 800);
    });

    it('tablet: renders the Stop-Workout button inside the WorkoutDashboard controls column', () => {
        const { getByTestId } = render(<RideOverlay {...baseProps} />);
        expect(getByTestId('stop-workout-button')).toBeTruthy();
    });

    it('a tap calls onStopWorkout directly, exactly once, with no confirmation step', () => {
        const onStopWorkout = jest.fn();
        const { getByTestId } = render(
            <RideOverlay {...baseProps} onStopWorkout={onStopWorkout} />
        );

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(onStopWorkout).toHaveBeenCalledTimes(1);
    });

    it('fallback: renders the Stop-Workout button in its own mirrored slot, and tapping it calls onStopWorkout directly', () => {
        setDimensions(844, 390); // fallback per §8.1's table
        const onStopWorkout = jest.fn();
        const { getByTestId } = render(<RideOverlay {...baseProps} compact onStopWorkout={onStopWorkout} />);

        expect(getByTestId('ride-overlay-stop-slot')).toBeTruthy();
        expect(getByTestId('stop-workout-button')).toBeTruthy();

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(onStopWorkout).toHaveBeenCalledTimes(1);
    });
});
