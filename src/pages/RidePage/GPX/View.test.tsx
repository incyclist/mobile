import React from 'react';
import { render } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';
import { avatarToConfig } from '../../../components/PrevRides';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

// AvatarService.get('current') is the source of currentAvatar — self-populating and independent
// of prevRides/nearbyRiders row state, unlike the old prevRides.rows.find(isCurrent) derivation
// this replaced.
const mockAvatarGet = jest.fn((_id: string) => ({ helmet: 'blue', shirt: 'red' }));
jest.mock('incyclist-services', () => ({
    useAvatars: () => ({ get: (id: string) => mockAvatarGet(id) }),
}));

const mockStartRideDisplay = jest.fn();
const mockRideOverlay = jest.fn();
const mockRideGestureHintOverlay = jest.fn();
const mockRideSwipeFeedback = jest.fn();
const mockFreeMap = jest.fn();
jest.mock('../../../components', () => ({
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    ErrorBoundary: ({ children }: any) => children,
    ElevationGraph: () => null,
    FreeMap: (props: any) => {
        mockFreeMap(props);
        return null;
    },
    MainBackground: () => null,
    RideDashboard: () => null,
    RideMenu: () => null,
    RideGestureHintOverlay: (props: any) => {
        mockRideGestureHintOverlay(props);
        const { Text } = require('react-native');
        return <Text>gesture-hint-overlay</Text>;
    },
    RideSwipeFeedback: (props: any) => {
        mockRideSwipeFeedback(props);
        return null;
    },
    StartRideDisplay: (props: any) => {
        mockStartRideDisplay(props);
        return null;
    },
    RideOverlay: (props: any) => {
        mockRideOverlay(props);
        const { Text } = require('react-native');
        return <Text>ride-overlay</Text>;
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
    gesture: undefined,
    feedback: { visible: false, message: '' },
    loadIncrementPct: 1,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
    getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
    onToggleCornerWidget: () => {},
    onStopWorkout: () => {},
    onGestureHintDismissed: () => {},
    onExpandPrevRides: () => {},
    onCollapsePrevRides: () => {},
    onSetPrevRidesVisibleRows: () => {},
    onSetPrevRidesMode: () => {},
    getPrevRidesRows: () => [],
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
// Workout overlay branch (workout-mobile-hld-phase2.md §5, session 5.1) — additive, prop-driven,
// gated on displayProps.workoutAttached. Route-only rendering (including the corner-map tests
// above) must be bit-for-bit unaffected.
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
        mockRideOverlay.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('does not render the overlay for a route-only ride', () => {
        const { queryByText } = render(<GPXTourPageView {...activeProps('sv')} />);
        expect(queryByText('ride-overlay')).toBeNull();
        expect(mockRideOverlay).not.toHaveBeenCalled();
    });

    it('renders the overlay when a workout is attached, and suppresses the route-only corner map', () => {
        const { getByText, queryByTestId } = render(
            <GPXTourPageView {...baseProps} displayProps={comboDisplayProps() as any} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();
        // The old corner-map element is suppressed — RideOverlay owns corner-widget
        // placement once combo is active (not a double-render of the same widget).
        expect(queryByTestId('gpx-corner-map')).toBeNull();

        const overlayProps = mockRideOverlay.mock.calls[0][0];
        expect(overlayProps.graph).toEqual({ bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0], y: [0, 0] } });
        expect(overlayProps.mapVisible).toBe(true); // StreetView main view + GPX route data present
    });

    it('forwards onStopWorkout through to the overlay unchanged (workout-mobile-hld-phase2.md §8.3, session 5.3)', () => {
        const onStopWorkout = jest.fn();
        render(
            <GPXTourPageView
                {...baseProps}
                displayProps={comboDisplayProps() as any}
                onStopWorkout={onStopWorkout}
            />
        );
        const overlayProps = mockRideOverlay.mock.calls[0][0];
        expect(overlayProps.onStopWorkout).toBe(onStopWorkout);
    });
});

// Regression: gesture wiring (useRideGestures, GestureDetector, RideGestureHintOverlay,
// RideSwipeFeedback) was only ever attached to WorkoutRidePageView - GPXTourPageView had none of
// it, even though RidePageService's adjustLoad()/onStepBack()/onStepForward() already worked
// correctly for a plain GPX ride.
describe('GPXTourPageView — swipe-gesture surface', () => {
    beforeEach(() => {
        mockRideGestureHintOverlay.mockClear();
        mockRideSwipeFeedback.mockClear();
    });

    it('forwards feedback.visible/message to RideSwipeFeedback',()=>{
        render(
            <GPXTourPageView
                {...activeProps('map')}
                feedback={{ visible: true, message: '+1% (155W)' }}
            />
        );
        expect(mockRideSwipeFeedback).toHaveBeenCalledWith(
            expect.objectContaining({ visible: true, message: '+1% (155W)' })
        );
    });

    it('does not render the gesture hint overlay while gestureHint is null',()=>{
        const { queryByText } = render(
            <GPXTourPageView {...activeProps('map')} displayProps={{ ...activeProps('map').displayProps, gestureHint: null } as any} />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });

    it('renders the gesture hint overlay with workout-attached content when a workout is attached',()=>{
        const { getByText } = render(
            <GPXTourPageView
                {...activeProps('map')}
                loadIncrementPct={5}
                displayProps={{
                    ...activeProps('map').displayProps,
                    gestureHint: { visible: true },
                    workoutAttached: true,
                } as any}
            />
        );
        expect(getByText('gesture-hint-overlay')).toBeTruthy();
        expect(mockRideGestureHintOverlay).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Start pedalling to start the workout' })
        );
        expect(mockRideGestureHintOverlay.mock.calls[0][0].legend).toEqual([
            expect.objectContaining({ label: 'Step back / forward' }),
            expect.objectContaining({ label: 'Load ±5%' }),
        ]);
    });

    it('renders the gesture hint overlay with plain-ERG content when no workout is attached',()=>{
        const { getByText } = render(
            <GPXTourPageView
                {...activeProps('map')}
                loadIncrementPct={1}
                displayProps={{
                    ...activeProps('map').displayProps,
                    gestureHint: { visible: true },
                    workoutAttached: false,
                    loadButtonMode: 'power',
                } as any}
            />
        );
        expect(getByText('gesture-hint-overlay')).toBeTruthy();
        expect(mockRideGestureHintOverlay.mock.calls[0][0]).toEqual(
            expect.objectContaining({ message: 'Start pedalling to start your ride', legendIntro: 'Swipe the screen to adjust your resistance:' })
        );
        expect(mockRideGestureHintOverlay.mock.calls[0][0].legend).toEqual([
            expect.objectContaining({ label: 'Power ±5W' }),
            expect.objectContaining({ label: 'Power ±50W' }),
        ]);
    });

    it('does not render the gesture hint overlay when there is nothing useful to teach (hidden mode, no workout)',()=>{
        const { queryByText } = render(
            <GPXTourPageView
                {...activeProps('map')}
                displayProps={{
                    ...activeProps('map').displayProps,
                    gestureHint: { visible: true },
                    workoutAttached: false,
                    loadButtonMode: 'hidden',
                } as any}
            />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });

    it('never renders the gesture hint overlay during the start overlay, even if gestureHint.visible is true',()=>{
        const { queryByText } = render(
            <GPXTourPageView
                {...baseProps}
                displayProps={{
                    ...baseProps.displayProps,
                    gestureHint: { visible: true },
                    workoutAttached: true,
                } as any}
            />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Previous-rides overlay wiring.
// Route-only rendering (the corner-map/workout-overlay tests above) must be unaffected whenever
// overlayActive is false — this is the regression the whole design depends on being impossible by
// construction.
// ---------------------------------------------------------------------------

const prevRidesRows = [
    { position: 1, label: '12.05.2026', timeGap: '-1:24', isCurrent: false, lat: 1, lng: 2, tsStart: 100 },
    { position: 2, label: 'You', timeGap: '+0:00', isCurrent: true, lat: 3, lng: 4, tsStart: 200 },
];

const prevRidesOnlyDisplayProps = () => ({
    ...activeProps('sv').displayProps,
    workoutAttached: false,
    prevRides: { mode: 'list' as const, rows: prevRidesRows, hasMore: false },
});

describe('GPXTourPageView — previous-rides overlay wiring', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockFreeMap.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('overlayActive via eligible previous rides alone (no workout) mounts the overlay and suppresses the route-only corner map', () => {
        const { getByText, queryByTestId } = render(
            <GPXTourPageView {...baseProps} displayProps={prevRidesOnlyDisplayProps() as any} />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not mount the overlay when prevRides.mode is "hidden" and no workout is attached (overlayActive stays false)', () => {
        const { queryByText, getByTestId } = render(
            <GPXTourPageView
                {...activeProps('sv')}
                displayProps={{
                    ...activeProps('sv').displayProps,
                    workoutAttached: false,
                    prevRides: { mode: 'hidden', rows: [], hasMore: false },
                } as any}
            />
        );

        expect(queryByText('ride-overlay')).toBeNull();
        // the route-only branches render exactly as before this feature existed
        expect(getByTestId('gpx-corner-map')).toBeTruthy();
    });

    it('tablet: passes the full prevRides row list through to the overlay for ear rendering', () => {
        const { getByText } = render(
            <GPXTourPageView {...baseProps} displayProps={prevRidesOnlyDisplayProps() as any} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.prevRides).toEqual(prevRidesRows);
    });

    it('phone (compact): sets the list mode default and still mounts the overlay for the corner-slot state', () => {
        mockUseScreenLayout.mockReturnValue('compact');
        const onSetPrevRidesMode = jest.fn();
        const { getByText } = render(
            <GPXTourPageView
                {...baseProps}
                displayProps={{ ...prevRidesOnlyDisplayProps(), cornerWidget: 'elevation' } as any}
                onSetPrevRidesMode={onSetPrevRidesMode}
            />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        expect(onSetPrevRidesMode).toHaveBeenCalledWith('list');
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.cornerWidget).toBe('elevation');
    });

    it('tablet (normal): sets the list mode default', () => {
        const onSetPrevRidesMode = jest.fn();
        render(
            <GPXTourPageView
                {...baseProps}
                displayProps={prevRidesOnlyDisplayProps() as any}
                onSetPrevRidesMode={onSetPrevRidesMode}
            />
        );

        expect(onSetPrevRidesMode).toHaveBeenCalledWith('list');
    });

    it('GPX marker target switches between the corner map (StreetView) and the main map (Map view) as rideView changes', () => {
        const { rerender } = render(
            <GPXTourPageView {...baseProps} displayProps={prevRidesOnlyDisplayProps() as any} />
        );

        // 'sv': no main map mounted at all, so it never receives markers.
        expect(mockFreeMap).not.toHaveBeenCalled();
        // the corner map lives inside the (mocked) RideOverlay — assert markers were handed to it.
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.mapPrevRiders).toEqual([
            { key: '100', position: { lat: 1, lng: 2 }, avatar: undefined },
        ]);

        mockFreeMap.mockClear();
        rerender(
            <GPXTourPageView
                {...baseProps}
                displayProps={{ ...prevRidesOnlyDisplayProps(), rideView: 'map' } as any}
            />
        );

        // 'map': the main FreeMap is now mounted and receives the same markers.
        expect(mockFreeMap).toHaveBeenCalled();
        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({
            riderMarkers: [{ key: '100', position: { lat: 1, lng: 2 }, avatar: undefined }],
        });
    });
});

// ---------------------------------------------------------------------------
// currentAvatar resolution — regression coverage. currentAvatar used to be derived from
// prevRides?.rows.find(row => row.isCurrent)?.avatar, which resolved to undefined (default marker
// styling) whenever prevRides had no eligible rows, e.g. a first-time route. It is now resolved
// directly via AvatarService (useAvatars().get('current')), which self-populates and is
// independent of prevRides/nearbyRiders row state entirely.
// ---------------------------------------------------------------------------

describe('GPXTourPageView — currentAvatar resolution', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockFreeMap.mockClear();
        mockAvatarGet.mockClear();
    });

    it('resolves currentAvatar from AvatarService even when prevRides is empty (regression: used to fall back to undefined)', () => {
        const { getByText } = render(
            <GPXTourPageView
                {...baseProps}
                displayProps={{
                    ...prevRidesOnlyDisplayProps(),
                    prevRides: { mode: 'list', rows: [], hasMore: false },
                } as any}
            />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
        expect(mockAvatarGet).toHaveBeenCalledWith('current');
    });

    it('resolves currentAvatar from AvatarService when prevRides is undefined', () => {
        const { getByText } = render(
            <GPXTourPageView
                {...baseProps}
                displayProps={{
                    ...prevRidesOnlyDisplayProps(),
                    prevRides: undefined,
                    nearbyRiders: { rows: [{ isUser: true, isPaused: false, isCoach: false, name: 'You', distance: { value: 0.9, unit: 'km' }, diffDistance: { value: 0, unit: 'm' }, avatar: { shirt: 'green', helmet: 'yellow' }, lat: 7, lng: 8 }] },
                } as any}
            />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
    });

    it('resolves the same currentAvatar from AvatarService when prevRides is populated — no longer sourced from its rows', () => {
        const { getByText } = render(
            <GPXTourPageView {...baseProps} displayProps={prevRidesOnlyDisplayProps() as any} />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
    });
});

// ---------------------------------------------------------------------------
// Nearby-riders overlay wiring (session 3.1) — overlayActive's three-way OR
// (comboActive || prevRidesEligible || nearbyRidersEligible), marker merging with PrevRides, and
// the legacy plain-corner-map branch becoming unreachable whenever either feature is eligible.
// ---------------------------------------------------------------------------

const nearbyRidersRows = [
    { isUser: false, isPaused: false, isCoach: false, name: 'Alex Rider', distance: { value: 1.0, unit: 'km' }, diffDistance: { value: 100, unit: 'm' }, avatar: { shirt: 'blue', helmet: 'red' }, lat: 5, lng: 6 },
    { isUser: true, isPaused: false, isCoach: false, name: 'You', distance: { value: 0.9, unit: 'km' }, diffDistance: { value: 0, unit: 'm' }, avatar: { shirt: 'green', helmet: 'yellow' }, lat: 7, lng: 8 },
];

const nearbyRidersOnlyDisplayProps = () => ({
    ...activeProps('sv').displayProps,
    workoutAttached: false,
    nearbyRiders: { rows: nearbyRidersRows },
});

describe('GPXTourPageView — nearby-riders overlay wiring', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockFreeMap.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('overlayActive via eligible nearby riders alone (no workout, no prevRides) mounts the overlay and suppresses the route-only corner map', () => {
        const { getByText, queryByTestId } = render(
            <GPXTourPageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps() as any} />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not mount the overlay when nearbyRiders is absent and no workout/prevRides eligible (overlayActive stays false)', () => {
        const { queryByText, getByTestId } = render(<GPXTourPageView {...activeProps('sv')} />);

        expect(queryByText('ride-overlay')).toBeNull();
        expect(getByTestId('gpx-corner-map')).toBeTruthy();
    });

    it('does not mount the overlay when nearbyRiders.rows is empty (present but nothing to show)', () => {
        const { queryByText, getByTestId } = render(
            <GPXTourPageView
                {...activeProps('sv')}
                displayProps={{ ...activeProps('sv').displayProps, workoutAttached: false, nearbyRiders: { rows: [] } } as any}
            />
        );

        expect(queryByText('ride-overlay')).toBeNull();
        expect(getByTestId('gpx-corner-map')).toBeTruthy();
    });

    it('passes the full nearbyRiders row list through to the overlay for ear rendering', () => {
        render(<GPXTourPageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps() as any} />);

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.nearbyRiders).toEqual(nearbyRidersRows);
    });

    it('merges nearby-riders markers into mapPrevRiders/riderMarkers, excluding the current user', () => {
        const { rerender } = render(
            <GPXTourPageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps() as any} />
        );

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        // 'You' (isUser: true) is excluded from the map; only Alex Rider's marker is present.
        expect(overlayProps.mapPrevRiders).toEqual([
            expect.objectContaining({ key: 'Alex Rider', position: { lat: 5, lng: 6 } }),
        ]);

        mockFreeMap.mockClear();
        rerender(
            <GPXTourPageView
                {...baseProps}
                displayProps={{ ...nearbyRidersOnlyDisplayProps(), rideView: 'map' } as any}
            />
        );
        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({
            riderMarkers: [expect.objectContaining({ key: 'Alex Rider', position: { lat: 5, lng: 6 } })],
        });
    });

    it('both PrevRides and Nearby Riders eligible simultaneously: mapPrevRiders/riderMarkers carries both features\' markers', () => {
        const combinedDisplayProps = {
            ...activeProps('map').displayProps,
            workoutAttached: false,
            prevRides: {
                mode: 'list' as const,
                rows: [{ position: 1, label: '12.05.2026', timeGap: '-1:24', isCurrent: false, lat: 1, lng: 2, tsStart: 100 }],
                hasMore: false,
            },
            nearbyRiders: { rows: nearbyRidersRows },
        };
        render(<GPXTourPageView {...baseProps} displayProps={combinedDisplayProps as any} />);

        expect(mockFreeMap.mock.calls.at(-1)?.[0]).toMatchObject({
            riderMarkers: [
                expect.objectContaining({ key: '100' }),
                expect.objectContaining({ key: 'Alex Rider' }),
            ],
        });
    });

    it('overlayActive truth table: comboActive || prevRidesEligible || nearbyRidersEligible', () => {
        const cases: Array<{ combo: boolean; prevMode: 'hidden' | 'list' | undefined; nearby: boolean; expected: boolean }> = [
            { combo: false, prevMode: undefined, nearby: false, expected: false },
            { combo: true, prevMode: undefined, nearby: false, expected: true },
            { combo: false, prevMode: 'list', nearby: false, expected: true },
            { combo: false, prevMode: 'hidden', nearby: false, expected: false },
            { combo: false, prevMode: undefined, nearby: true, expected: true },
            { combo: true, prevMode: 'list', nearby: true, expected: true },
        ];

        cases.forEach(({ combo, prevMode, nearby, expected }) => {
            mockRideOverlay.mockClear();
            const displayProps: any = {
                ...activeProps('sv').displayProps,
                workoutAttached: combo,
                ...(combo ? { graph: {}, steps: {}, dashboard: {} } : {}),
                ...(prevMode ? { prevRides: { mode: prevMode, rows: [], hasMore: false } } : {}),
                ...(nearby ? { nearbyRiders: { rows: nearbyRidersRows } } : {}),
            };
            const { queryByText, unmount } = render(<GPXTourPageView {...baseProps} displayProps={displayProps} />);

            expect(queryByText('ride-overlay') !== null).toBe(expected);
            unmount();
        });
    });
});
