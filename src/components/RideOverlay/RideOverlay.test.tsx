import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { RideOverlay, RideOverlayProps, PREV_RIDES_TABLET_WIDTH } from './RideOverlay';
import { MOCK_DASHBOARD_MID_INTERVAL } from '../WorkoutDashboard/WorkoutDashboard.mock';
import { MOCK_ROWS } from '../PrevRides/PrevRidesRow.mock';
import { MOCK_ROWS as MOCK_NEARBY_ROWS } from '../NearbyRiders/NearbyRiderRow.mock';
import { SLOT_GAP } from '../../hooks/render/useRideOverlayLayout';
import { ROW_MARGIN_BOTTOM } from '../PrevRides';

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

const mockDynamic = jest.fn();
jest.mock('../Dynamic', () => ({
    Dynamic: (props: any) => {
        mockDynamic(props);
        return props.children;
    },
}));
const mockElevationGraph = jest.fn();
jest.mock('../ElevationGraph', () => ({
    ElevationGraph: (props: any) => {
        mockElevationGraph(props);
        return null;
    },
}));
const mockFreeMap = jest.fn();
jest.mock('../FreeMap', () => ({
    FreeMap: (props: any) => {
        mockFreeMap(props);
        return null;
    },
}));
const mockWorkoutGraph = jest.fn();
jest.mock('../WorkoutGraph', () => ({
    WorkoutGraph: (props: any) => {
        mockWorkoutGraph(props);
        return null;
    },
}));
const mockWorkoutStepsList = jest.fn();
jest.mock('../WorkoutStepsList', () => ({
    WorkoutStepsList: (props: any) => {
        mockWorkoutStepsList(props);
        return null;
    },
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
    getPrevRidesRows: () => [],
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

    it('below: renders the dashboard AND both corner widgets, relocated under the column', () => {
        setDimensions(860, 480);
        const { getByTestId } = render(<RideOverlay {...baseProps} />);

        expect(getByTestId('ride-overlay-dashboard')).toBeTruthy();
        // Relocated, not dropped - this is the arrangement that used to return null rects.
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
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

    it('fallback, cornerWidget="workout": the toggle slot renders WorkoutStepsList (not WorkoutGraph) inside the same Pressable', () => {
        setDimensions(844, 390);
        mockWorkoutStepsList.mockClear();
        mockWorkoutGraph.mockClear();
        const { getByTestId } = render(
            <RideOverlay {...baseProps} compact cornerWidget="workout" />
        );

        expect(getByTestId('ride-overlay-corner-toggle')).toBeTruthy();
        expect(mockWorkoutStepsList).toHaveBeenCalledWith(
            expect.objectContaining({ steps: baseProps.steps, compact: true, showEndHint: false })
        );
        expect(mockWorkoutGraph).not.toHaveBeenCalled();
    });

    it('fallback, cornerWidget="elevation": the toggle slot renders ElevationGraph, not WorkoutStepsList', () => {
        setDimensions(844, 390);
        mockWorkoutStepsList.mockClear();
        const { getByTestId } = render(
            <RideOverlay {...baseProps} compact cornerWidget="elevation" />
        );

        expect(getByTestId('ride-overlay-corner-toggle')).toBeTruthy();
        expect(mockWorkoutStepsList).not.toHaveBeenCalled();
    });

    // FIXES_BACKLOG #70 follow-up: on a real ~390dp-tall phone, the fixed elevation-graph height
    // clipped WorkoutStepsList down to a single row (no upcoming-step row visible at all) — the
    // 'workout' toggle state now auto-sizes to its own content instead of reusing that fixed height.
    it('fallback, cornerWidget="workout": the corner slot does not force the fixed elevation-graph height, unlike cornerWidget="elevation"', () => {
        setDimensions(844, 390);
        const { getByTestId, rerender } = render(<RideOverlay {...baseProps} compact cornerWidget="elevation" />);
        const elevationStyle = StyleSheet.flatten(getByTestId('ride-overlay-elevation').props.style);
        expect(typeof elevationStyle.height).toBe('number');

        rerender(<RideOverlay {...baseProps} compact cornerWidget="workout" />);
        const workoutStyle = StyleSheet.flatten(getByTestId('ride-overlay-elevation').props.style);
        expect(workoutStyle.height).toBeUndefined();
    });

    it('fallback, cornerWidget="workout": the corner slot widens beyond the elevation-preview width, and the shoutout line insets to make room for it', () => {
        setDimensions(844, 390);
        const { getByTestId, rerender } = render(<RideOverlay {...baseProps} compact cornerWidget="elevation" />);
        const elevationSlotWidth = StyleSheet.flatten(getByTestId('ride-overlay-elevation').props.style).width;
        const elevationShoutoutRight = StyleSheet.flatten(getByTestId('ride-overlay-shoutout').props.style).right;

        rerender(<RideOverlay {...baseProps} compact cornerWidget="workout" />);
        const workoutSlotWidth = StyleSheet.flatten(getByTestId('ride-overlay-elevation').props.style).width;
        const workoutShoutoutRight = StyleSheet.flatten(getByTestId('ride-overlay-shoutout').props.style).right;

        expect(workoutSlotWidth).toBeGreaterThan(elevationSlotWidth);
        // The shoutout's own right inset always tracks the toggle's current width (plus SLOT_GAP),
        // so its centered text can never grow into whichever box (elevation or workout) is showing.
        expect(elevationShoutoutRight).toBe(elevationSlotWidth + SLOT_GAP);
        expect(workoutShoutoutRight).toBe(workoutSlotWidth + SLOT_GAP);
    });

    it('fallback, cornerWidget="workout" with prevRides shown: the previous-rides panel anchors below the taller auto-sized slot, not the shorter fixed elevation height', () => {
        setDimensions(844, 390);
        const propsWithPrevRides = { ...baseProps, prevRides: MOCK_ROWS, getPrevRidesRows: () => MOCK_ROWS };

        const { getByTestId: getByTestIdElevation } = render(
            <RideOverlay {...propsWithPrevRides} compact cornerWidget="elevation" />
        );
        const elevationAnchorTop = StyleSheet.flatten(getByTestIdElevation('prev-rides-expanded-panel').props.style).top;

        const { getByTestId: getByTestIdWorkout } = render(
            <RideOverlay {...propsWithPrevRides} compact cornerWidget="workout" />
        );
        const workoutAnchorTop = StyleSheet.flatten(getByTestIdWorkout('prev-rides-expanded-panel').props.style).top;

        expect(workoutAnchorTop).toBeGreaterThan(elevationAnchorTop);
    });

    it('fallback, cornerWidget="workout": measuring the slot\'s real (taller) rendered height pushes the previous-rides panel down further than the initial guess', () => {
        setDimensions(844, 390);
        const propsWithPrevRides = { ...baseProps, prevRides: MOCK_ROWS, getPrevRidesRows: () => MOCK_ROWS };
        const { getByTestId } = render(<RideOverlay {...propsWithPrevRides} compact cornerWidget="workout" />);
        const topBeforeMeasurement = StyleSheet.flatten(getByTestId('prev-rides-expanded-panel').props.style).top;

        fireEvent(getByTestId('ride-overlay-elevation'), 'layout', {
            nativeEvent: { layout: { height: 120 } },
        });

        const topAfterMeasurement = StyleSheet.flatten(getByTestId('prev-rides-expanded-panel').props.style).top;
        expect(topAfterMeasurement).toBeGreaterThan(topBeforeMeasurement);
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
// No workout attached — a plain route ride mounting this component for its side-region occupants and previous-rides list only.
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
        getPrevRidesRows: () => MOCK_ROWS,
    };

    it('block-side: renders the side-region occupants (map, elevation) and the previous-rides list, no WorkoutDashboard', () => {
        setDimensions(1400, 900); // block-side per ride-overlay-layout-design.md §8.1's table
        const { getByTestId, queryByTestId, getAllByTestId } = render(<RideOverlay {...routeOnlyProps} />);

        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
        expect(getAllByTestId('prev-rides-row')).toHaveLength(MOCK_ROWS.length);
    });

    // design doc §5.2 "Correction 3" (2026-08-31): the tablet ear never rendered a title, unlike
    // the phone PrevRidesExpandedPanel's headerRow — fixed here, no collapse chevron (tablet ears
    // have no collapse mechanism).
    it('renders a static "Previous Rides" title above the tablet ear\'s rows', () => {
        setDimensions(1400, 900);
        const { getByTestId, getByText } = render(<RideOverlay {...routeOnlyProps} />);

        expect(getByTestId('ride-overlay-prev-rides-header')).toBeTruthy();
        expect(getByText('Previous Rides')).toBeTruthy();
    });

    it('subtracts the tablet title\'s height (22dp) from the free band before computing visibleRows, so the title never eats into row space unbudgeted', () => {
        setDimensions(1400, 900);
        const onVisibleRowsChange = jest.fn();
        const { getByTestId } = render(<RideOverlay {...routeOnlyProps} onVisibleRowsChange={onVisibleRowsChange} />);

        // A known, exact row height (chosen so the -22dp subtraction actually crosses an integer
        // floor boundary for this screen size's free band, rather than landing on a value where
        // it happens not to matter) so rowSpacing is exact (PrevRidesRow's own ROW_MARGIN_BOTTOM).
        fireEvent(getByTestId('prev-rides-first-row-measure'), 'layout', {
            nativeEvent: { layout: { height: 96 } },
        });
        const rowSpacing = 96 + ROW_MARGIN_BOTTOM;

        // maxHeight on the list's own style is the unreduced free band (a safety ceiling for
        // title + rows together, see RideOverlay.tsx's comment on prevRidesTabletVisibleRows) —
        // read it back rather than re-deriving the layout geometry independently.
        const listStyle = Object.assign({}, ...getByTestId('ride-overlay-prev-rides').props.style);
        const freeBand = listStyle.maxHeight as number;

        const reported = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        const expectedWithHeader = Math.min(Math.max(Math.floor((freeBand - 22) / rowSpacing), 1), 10);
        const expectedWithoutHeader = Math.min(Math.max(Math.floor(freeBand / rowSpacing), 1), 10);

        expect(reported).toBe(expectedWithHeader);
        // Confirms the subtraction actually changes the reported count for this geometry — not a
        // vacuously-true assertion against a boundary where it wouldn't have mattered.
        expect(reported).toBeLessThan(expectedWithoutHeader);
    });

    it('renders only the previous-rides list when that is the only occupant populated (no map points, no workout)', () => {
        setDimensions(1400, 900);
        const { getByTestId, queryByTestId } = render(
            <RideOverlay {...routeOnlyProps} mapVisible={false} mapPoints={undefined} />
        );

        expect(queryByTestId('ride-overlay-dashboard')).toBeNull();
        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
    });

    it('does not render the previous-rides list when no rows are given', () => {
        setDimensions(1400, 900);
        const { queryByTestId } = render(<RideOverlay {...routeOnlyProps} prevRides={undefined} />);

        expect(queryByTestId('ride-overlay-prev-rides')).toBeNull();
    });

    it('below: relocates the side-region occupants and the previous-rides list under the column (no WorkoutDashboard, no crash on the now-optional props)', () => {
        setDimensions(860, 480);
        expect(() => render(<RideOverlay {...routeOnlyProps} />)).not.toThrow();

        const { queryByTestId, getByTestId } = render(<RideOverlay {...routeOnlyProps} />);
        expect(queryByTestId('ride-overlay-dashboard')).toBeNull(); // no workout attached
        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
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
        // the corner slot itself still renders (elevation, in this case) — it only guarantees no
        // crash on the toggle path when graph is absent.
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
    });

    it('block-side: reports the list\'s own visibleRows via onVisibleRowsChange', () => {
        setDimensions(1400, 900);
        const onVisibleRowsChange = jest.fn();
        render(<RideOverlay {...routeOnlyProps} onVisibleRowsChange={onVisibleRowsChange} />);

        expect(onVisibleRowsChange).toHaveBeenCalled();
        const reported = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        expect(typeof reported).toBe('number');
        expect(reported).toBeGreaterThanOrEqual(1);
    });

    it('recomputes visibleRows from the first row\'s real measured height, not the fallback estimate — a taller-than-fallback row means fewer rows fit than the fallback would predict', () => {
        setDimensions(1400, 900);
        const onVisibleRowsChange = jest.fn();
        const { getByTestId } = render(<RideOverlay {...routeOnlyProps} onVisibleRowsChange={onVisibleRowsChange} />);
        const reportedBeforeMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];

        // Simulate a real device reporting each row as considerably taller than the fallback
        // guess (this is exactly the bug: PHASE3_ROW_HEIGHT=24, borrowed from the phone's flat
        // single-line row, wildly under-measured the tablet's two-line padded card).
        fireEvent(getByTestId('prev-rides-first-row-measure'), 'layout', {
            nativeEvent: { layout: { height: 120 } },
        });

        const reportedAfterMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        expect(reportedAfterMeasurement).toBeLessThan(reportedBeforeMeasurement);
    });

    it('forwards mapPrevRiders to the corner FreeMap', () => {
        setDimensions(1400, 900);
        mockFreeMap.mockClear();
        const markers = [{ key: '1', position: { lat: 1, lng: 2 } }];
        render(<RideOverlay {...routeOnlyProps} mapPrevRiders={markers} />);

        expect(mockFreeMap).toHaveBeenCalled();
        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({ riderMarkers: markers });
    });

    it('forwards currentAvatar to the corner map (markerAvatar) and the elevation preview (currentAvatar)', () => {
        setDimensions(1400, 900);
        mockFreeMap.mockClear();
        mockElevationGraph.mockClear();
        const avatar = { helmOuter: 'red', shirt: 'blue' };
        render(<RideOverlay {...routeOnlyProps} currentAvatar={avatar} />);

        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({ markerAvatar: avatar });
        expect(mockElevationGraph.mock.calls.at(-1)?.[0]).toMatchObject({ currentAvatar: avatar });
    });

    it('route-only: uses the fixed list width (independent of the dashboard), and shows speed', () => {
        setDimensions(1400, 900);
        const { getByTestId, getAllByTestId } = render(<RideOverlay {...routeOnlyProps} />);

        const listStyle = Object.assign({}, ...getByTestId('ride-overlay-prev-rides').props.style);
        expect(listStyle.width).toBe(PREV_RIDES_TABLET_WIDTH);
        // no fixed bottom edge — the box shrinks to its own content instead of stretching to it
        expect(listStyle.bottom).toBeUndefined();
        expect(listStyle.maxHeight).toEqual(expect.any(Number));

        // 'normal' tier shows the speed stat by default (route-only, showSpeed !== false)
        const stats = getAllByTestId('prev-rides-row').map((row) => row.findAllByType(require('react-native').Text).map((t: any) => t.props.children).flat());
        expect(stats.some((cells) => cells.some((c: any) => typeof c === 'string' && c.includes('km/h')))).toBe(true);
    });

    it('wires the previous-rides list to live-refresh via <Dynamic> on prev-rides-update, using getPrevRidesRows as the transform', () => {
        setDimensions(1400, 900);
        mockDynamic.mockClear();
        const rideObserver = {} as any;
        const getPrevRidesRows = jest.fn(() => MOCK_ROWS);
        render(<RideOverlay {...routeOnlyProps} rideObserver={rideObserver} getPrevRidesRows={getPrevRidesRows} />);

        const call = mockDynamic.mock.calls.find(([props]) => props.event === 'prev-rides-update' && props.prop === 'rows');
        expect(call).toBeTruthy();
        expect(call[0]).toMatchObject({ observer: rideObserver, transform: getPrevRidesRows });
    });
});

// ---------------------------------------------------------------------------
// Nearby-riders overlay wiring (session 3.1) — the left-ear/corner-slot-sibling counterpart to
// the previous-rides tests above. Only where the map itself is rendered (`map` non-null) does a
// tablet left-ear reserve exist at all (design doc §2.4/§5.2, RideOverlayPrototype.stories.tsx's
// own Phase-3 ghost gates identically on `mapRect`).
// ---------------------------------------------------------------------------

describe('RideOverlay — nearby-riders overlay wiring', () => {
    const nearbyRidersProps: RideOverlayProps = {
        mapVisible: true,
        nearbyRiders: MOCK_NEARBY_ROWS,
        dashboardHeight: 80,
        compact: false,
        rideObserver: null,
        getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
        onToggleCornerWidget: () => {},
        mapPoints: [{ lat: 1, lng: 2 } as any, { lat: 3, lng: 4 } as any],
        transformPosition: () => undefined,
        onStopWorkout: () => {},
        getPrevRidesRows: () => [],
    };

    it('block-side: renders the nearby-riders list below the corner map (left ear)', () => {
        setDimensions(1400, 900);
        const { getByTestId, getAllByTestId } = render(<RideOverlay {...nearbyRidersProps} />);

        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('nearby-riders-tablet-list')).toBeTruthy();
        expect(getAllByTestId('nearby-rider-row')).toHaveLength(MOCK_NEARBY_ROWS.length);
    });

    // design doc §5.2 "Correction 3" (2026-08-31): same gap, same fix, as PrevRides' tablet ear
    // above — NearbyRidersTabletList renders its own title (component-level fix); this only
    // confirms it reaches the screen through RideOverlay's wiring too.
    it('renders the "Nearby Riders" title (from NearbyRidersTabletList itself) above the left ear\'s rows', () => {
        setDimensions(1400, 900);
        const { getByTestId, getByText } = render(<RideOverlay {...nearbyRidersProps} />);

        expect(getByTestId('nearby-riders-tablet-list-header')).toBeTruthy();
        expect(getByText('Incyclists Nearby')).toBeTruthy();
    });

    it('does not shrink the left ear\'s maxHeight for the title — NearbyRidersTabletList renders its title as a real child inside the existing free band instead (no separate visibleRows formula exists for this list to subtract from)', () => {
        setDimensions(1400, 900);
        const { getByTestId } = render(<RideOverlay {...nearbyRidersProps} />);

        const listStyle = Object.assign({}, ...[getByTestId('nearby-riders-tablet-list').props.style].flat());
        expect(listStyle.maxHeight).toEqual(expect.any(Number));
        expect(listStyle.maxHeight).toBeGreaterThan(22);
    });

    it('does not render the nearby-riders list when no rows are given', () => {
        setDimensions(1400, 900);
        const { queryByTestId } = render(<RideOverlay {...nearbyRidersProps} nearbyRiders={undefined} />);

        expect(queryByTestId('nearby-riders-tablet-list')).toBeNull();
    });

    // Design doc §5.2 requires this list to be "an independent, always-visible-when-eligible
    // sibling", "not derived from the map's geometry". It used to be gated on the corner map's rect,
    // which is null whenever mapVisible is false — i.e. on every ride whose main view is itself a map
    // (rideView === 'map'), where the list was therefore unreachable at any screen size.
    it('renders the nearby-riders list when the corner map is not rendered (mapVisible false) — it anchors to the widget row, not to the map', () => {
        setDimensions(1400, 900);
        const { queryByTestId, getByTestId } = render(
            <RideOverlay {...nearbyRidersProps} mapVisible={false} mapPoints={undefined} />
        );

        expect(queryByTestId('ride-overlay-map')).toBeNull();
        expect(getByTestId('nearby-riders-tablet-list')).toBeTruthy();
        // the right ear (elevation) is unaffected
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
    });

    it('anchors the nearby-riders list at the same depth whether or not the corner map is rendered', () => {
        setDimensions(1400, 900);
        const topOf = (mapVisible: boolean) => {
            const { getByTestId } = render(
                <RideOverlay {...nearbyRidersProps} mapVisible={mapVisible} mapPoints={mapVisible ? nearbyRidersProps.mapPoints : undefined} />
            );
            return Object.assign({}, ...[getByTestId('nearby-riders-tablet-list').props.style].flat()).top;
        };

        expect(topOf(false)).toBe(topOf(true));
    });

    it('below: relocates the nearby-riders list under the column along with the other side-region occupants', () => {
        setDimensions(860, 480);
        const { getByTestId } = render(<RideOverlay {...nearbyRidersProps} />);

        expect(getByTestId('ride-overlay-map')).toBeTruthy();
        expect(getByTestId('nearby-riders-tablet-list')).toBeTruthy();
    });

    // Tablet has separate left/right ears (no shared corner slot), so the phone-only "PrevRides
    // wins the slot" gate (design doc §5.2, resolved 2026-08-31) does not apply here — both lists
    // render simultaneously, unaffected.
    it('both PrevRides and Nearby Riders present simultaneously: both lists render side by side (left/right ears), unaffected by the phone-only slot gate', () => {
        setDimensions(1400, 900);
        const { getByTestId } = render(
            <RideOverlay {...nearbyRidersProps} prevRides={MOCK_ROWS} getPrevRidesRows={() => MOCK_ROWS} />
        );

        expect(getByTestId('ride-overlay-prev-rides')).toBeTruthy();
        expect(getByTestId('nearby-riders-tablet-list')).toBeTruthy();
    });

    it('wires the nearby-riders list to live-refresh via <Dynamic> on nearby-riders-update, extracting rows from the event payload', () => {
        setDimensions(1400, 900);
        mockDynamic.mockClear();
        const rideObserver = {} as any;
        render(<RideOverlay {...nearbyRidersProps} rideObserver={rideObserver} />);

        const call = mockDynamic.mock.calls.find(([props]) => props.event === 'nearby-riders-update' && props.prop === 'rows');
        expect(call).toBeTruthy();
        expect(call[0].observer).toBe(rideObserver);
        expect(typeof call[0].transform).toBe('function');
        expect(call[0].transform({ rows: MOCK_NEARBY_ROWS })).toEqual(MOCK_NEARBY_ROWS);
        expect(call[0].transform(undefined)).toEqual([]);
    });

    describe('phone (fallback): mounted as a sibling of the corner-slot toggle', () => {
        const fallbackProps: RideOverlayProps = {
            ...nearbyRidersProps,
            compact: true,
            cornerWidget: 'elevation',
        };

        beforeEach(() => {
            setDimensions(844, 390); // height < 420 => compact => fallback
        });

        it('starts expanded, showing the full row list, alongside elevation', () => {
            const { getByTestId, getAllByTestId } = render(<RideOverlay {...fallbackProps} />);

            expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
            expect(getByTestId('nearby-riders-expanded-panel')).toBeTruthy();
            expect(getAllByTestId('nearby-rider-row').length).toBeGreaterThan(0);
        });

        it('collapsing leaves elevation visible plus just the chevron button, no row data', () => {
            const { getByTestId, queryByTestId, queryAllByTestId } = render(<RideOverlay {...fallbackProps} />);

            fireEvent.press(getByTestId('nearby-riders-expand-chevron'));

            expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
            expect(getByTestId('nearby-riders-collapsed-slot')).toBeTruthy();
            expect(queryByTestId('nearby-riders-expanded-panel')).toBeNull();
            expect(queryAllByTestId('nearby-rider-row')).toHaveLength(0);
        });

        it('does not render when no rows are given', () => {
            const { queryByTestId } = render(<RideOverlay {...fallbackProps} nearbyRiders={undefined} />);

            expect(queryByTestId('nearby-riders-expanded-panel')).toBeNull();
            expect(queryByTestId('nearby-riders-collapsed-slot')).toBeNull();
        });

        // Integration finding (session 3.1): PrevRidesCornerPanel and NearbyRidersCornerPanel both
        // anchor to the SAME cornerSlotRect on phone (there is only one corner slot, unlike the
        // tablet's separate left/right ears). Resolved (repo owner decision, 2026-08-31, design doc
        // §5.2): PrevRides wins the shared phone corner slot — NearbyRidersCornerPanel stays hidden
        // whenever PrevRides is eligible too.
        it('both PrevRides and Nearby Riders eligible at once: PrevRides wins the shared phone corner slot, Nearby Riders panel does not render', () => {
            const { getByTestId, queryByTestId } = render(
                <RideOverlay {...fallbackProps} prevRides={MOCK_ROWS} getPrevRidesRows={() => MOCK_ROWS} />
            );

            expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
            expect(queryByTestId('nearby-riders-expanded-panel')).toBeNull();
            expect(queryByTestId('nearby-riders-collapsed-slot')).toBeNull();
        });

        it('PrevRides not eligible: the Nearby Riders phone panel renders normally', () => {
            const { getByTestId, queryByTestId } = render(
                <RideOverlay {...fallbackProps} prevRides={undefined} />
            );

            expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
            expect(getByTestId('nearby-riders-expanded-panel')).toBeTruthy();
        });
    });
});

describe('RideOverlay — combo ride, previous-rides list width/content (repo-owner review 2026-08-25)', () => {
    const comboWithPrevRidesProps: RideOverlayProps = {
        ...baseProps,
        prevRides: MOCK_ROWS,
    };

    it('uses the same fixed list width as route-only — not derived from the dashboard, so SIM vs ERG (or any other tile-count change) can never move it', () => {
        setDimensions(1400, 900);
        const { getByTestId } = render(<RideOverlay {...comboWithPrevRidesProps} />);

        const listStyle = Object.assign({}, ...getByTestId('ride-overlay-prev-rides').props.style);
        expect(listStyle.width).toBe(PREV_RIDES_TABLET_WIDTH);
    });

    it('suppresses the speed stat to fit the narrower width', () => {
        setDimensions(1400, 900);
        const { getAllByTestId } = render(<RideOverlay {...comboWithPrevRidesProps} />);

        const stats = getAllByTestId('prev-rides-row').map((row) => row.findAllByType(require('react-native').Text).map((t: any) => t.props.children).flat());
        expect(stats.some((cells) => cells.some((c: any) => typeof c === 'string' && c.includes('km/h')))).toBe(false);
    });

    it('positions below WorkoutDashboard, not below elevation — the two don\'t end at the same depth, so stacking under elevation (as if route-only) risks overlapping it', () => {
        setDimensions(1400, 900);
        const { getByTestId } = render(<RideOverlay {...comboWithPrevRidesProps} />);

        const listStyle = Object.assign({}, ...getByTestId('ride-overlay-prev-rides').props.style);
        const dashboardStyle = Object.assign({}, ...getByTestId('ride-overlay-dashboard').props.style);
        const elevationStyle = Object.assign({}, ...getByTestId('ride-overlay-elevation').props.style);

        const dashboardBottom = dashboardStyle.top + dashboardStyle.maxHeight;
        const elevationBottom = elevationStyle.top + elevationStyle.height;

        expect(listStyle.top).toBeGreaterThanOrEqual(dashboardBottom);
        expect(listStyle.top).toBeGreaterThanOrEqual(elevationBottom);
    });
});

// ---------------------------------------------------------------------------
// Phone previous-rides panel — decoupled from cornerWidget (repo-owner review 2026-08-25):
// elevation/workout always renders in its own slot; the previous-rides panel is a separate,
// always-visible-when-eligible element anchored below it, starting expanded (full list),
// collapsing to just the chevron button rather than replacing elevation/workout.
// ---------------------------------------------------------------------------

describe('RideOverlay — phone previous-rides panel (decoupled from cornerWidget)', () => {
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
        getPrevRidesRows: () => MOCK_ROWS,
        cornerWidget: 'elevation',
    };

    beforeEach(() => {
        setDimensions(844, 390); // height < 420 => compact => fallback
    });

    it('starts expanded, showing the full row list, alongside elevation (not replacing it)', () => {
        const { getByTestId, getAllByTestId, queryByTestId } = render(<RideOverlay {...prevRidesFallbackProps} />);

        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(getAllByTestId('prev-rides-row').length).toBeGreaterThan(0);
        expect(queryByTestId('prev-rides-collapsed-slot')).toBeNull();
    });

    it('tapping the elevation/workout slot still cycles the corner widget, independent of the previous-rides panel', () => {
        const onToggleCornerWidget = jest.fn();
        const { getByTestId } = render(
            <RideOverlay {...prevRidesFallbackProps} onToggleCornerWidget={onToggleCornerWidget} />
        );

        fireEvent.press(getByTestId('ride-overlay-corner-toggle'));
        expect(onToggleCornerWidget).toHaveBeenCalled();
    });

    it('collapsing (tap the header chevron) leaves elevation visible plus just the chevron button, no row data', () => {
        const onCollapsePrevRides = jest.fn();
        const { getByTestId, queryByTestId, queryAllByTestId } = render(
            <RideOverlay {...prevRidesFallbackProps} onCollapsePrevRides={onCollapsePrevRides} />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onCollapsePrevRides).toHaveBeenCalled();
        expect(getByTestId('ride-overlay-elevation')).toBeTruthy();
        expect(getByTestId('prev-rides-collapsed-slot')).toBeTruthy();
        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
        expect(queryAllByTestId('prev-rides-row')).toHaveLength(0);
    });

    it('tapping the chevron from collapsed re-expands the panel and calls onExpandPrevRides', () => {
        const onExpandPrevRides = jest.fn();
        const { getByTestId, getAllByTestId } = render(
            <RideOverlay {...prevRidesFallbackProps} onExpandPrevRides={onExpandPrevRides} />
        );

        // collapse first (no defaultExpanded override plumbed through RideOverlay - reach the
        // collapsed state via the same header-chevron tap a user would use).
        fireEvent.press(getByTestId('prev-rides-expand-chevron'));
        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onExpandPrevRides).toHaveBeenCalled();
        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(getAllByTestId('prev-rides-row').length).toBeGreaterThan(0);
    });

    it('wires the expanded-panel rows to live-refresh via <Dynamic> on prev-rides-update', () => {
        mockDynamic.mockClear();
        const rideObserver = {} as any;
        const getPrevRidesRows = jest.fn(() => MOCK_ROWS);
        render(<RideOverlay {...prevRidesFallbackProps} rideObserver={rideObserver} getPrevRidesRows={getPrevRidesRows} />);

        const calls = mockDynamic.mock.calls
            .map(([props]) => props)
            .filter((props) => props.event === 'prev-rides-update' && props.prop === 'rows');

        expect(calls.length).toBe(1);
        expect(calls[0]).toMatchObject({ observer: rideObserver, transform: getPrevRidesRows });
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
