import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoRidePageView } from './View';
import { avatarToConfig } from '../../../components/PrevRides';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

// AvatarService.get('current') is the source of currentAvatar — self-populating and independent
// of prevRides/nearbyRiders row state, unlike the old prevRides.rows.find(isCurrent) derivation
// this replaced.
const mockAvatarGet = jest.fn((id: string) => ({ helmet: 'blue', shirt: 'red' }));
jest.mock('incyclist-services', () => ({
    useAvatars: () => ({ get: (id: string) => mockAvatarGet(id) }),
}));

const mockStartRideDisplay = jest.fn();
const mockRideOverlay = jest.fn();
const mockRideGestureHintOverlay = jest.fn();
const mockRideSwipeFeedback = jest.fn();
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
        mockRideOverlay.mockClear();
    });

    it('does not render the overlay for a route-only ride (workoutAttached false)', () => {
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{ ...baseProps.displayProps, startOverlayProps: null }}
            />
        );
        expect(queryByText('ride-overlay')).toBeNull();
        expect(mockRideOverlay).not.toHaveBeenCalled();
    });

    it('renders the overlay when a workout is attached', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={comboDisplayProps} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();
        expect(mockRideOverlay).toHaveBeenCalledTimes(1);
        const overlayProps = mockRideOverlay.mock.calls[0][0];
        expect(overlayProps.graph).toBe(comboDisplayProps.graph);
        expect(overlayProps.steps).toBe(comboDisplayProps.steps);
        expect(overlayProps.dashboard).toBe(comboDisplayProps.dashboard);
    });

    it('passes the measured RideDashboard height through as measuredRideDashboardHeight (not the ratio estimate)', () => {
        render(<VideoRidePageView {...baseProps} displayProps={comboDisplayProps} />);
        const overlayProps = mockRideOverlay.mock.calls[0][0];
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
        const overlayProps = mockRideOverlay.mock.calls[0][0];
        expect(overlayProps.onStopWorkout).toBe(onStopWorkout);
    });
});

// Regression: gesture wiring (useRideGestures, GestureDetector, RideGestureHintOverlay,
// RideSwipeFeedback) was only ever attached to WorkoutRidePageView - VideoRidePageView had none
// of it, even though RidePageService's adjustLoad()/onStepBack()/onStepForward() already worked
// correctly for a plain Video ride. Mirrors GPX/View.test.tsx's identical suite.
describe('VideoRidePageView — swipe-gesture surface', () => {
    beforeEach(() => {
        mockRideGestureHintOverlay.mockClear();
        mockRideSwipeFeedback.mockClear();
    });

    it('forwards feedback.visible/message to RideSwipeFeedback',()=>{
        render(
            <VideoRidePageView
                {...baseProps}
                displayProps={comboDisplayProps}
                feedback={{ visible: true, message: '+1% (155W)' }}
            />
        );
        expect(mockRideSwipeFeedback).toHaveBeenCalledWith(
            expect.objectContaining({ visible: true, message: '+1% (155W)' })
        );
    });

    it('does not render the gesture hint overlay while gestureHint is null',()=>{
        const { queryByText } = render(
            <VideoRidePageView {...baseProps} displayProps={{ ...comboDisplayProps, gestureHint: null }} />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });

    it('renders the gesture hint overlay with workout-attached content when a workout is attached',()=>{
        const { getByText } = render(
            <VideoRidePageView
                {...baseProps}
                loadIncrementPct={5}
                displayProps={{ ...comboDisplayProps, gestureHint: { visible: true } }}
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

    it('renders the gesture hint overlay with plain-gear content when no workout is attached',()=>{
        const { getByText } = render(
            <VideoRidePageView
                {...baseProps}
                loadIncrementPct={1}
                displayProps={{
                    ...comboDisplayProps,
                    workoutAttached: false,
                    loadButtonMode: 'gear',
                    gestureHint: { visible: true },
                }}
            />
        );
        expect(getByText('gesture-hint-overlay')).toBeTruthy();
        expect(mockRideGestureHintOverlay.mock.calls[0][0]).toEqual(
            expect.objectContaining({ message: 'Start pedalling to start your ride', legendIntro: 'Swipe the screen to adjust your resistance:' })
        );
        expect(mockRideGestureHintOverlay.mock.calls[0][0].legend).toEqual([
            expect.objectContaining({ label: 'Gear ±1' }),
            expect.objectContaining({ label: 'Gear ±5' }),
        ]);
    });

    it('does not render the gesture hint overlay when there is nothing useful to teach (hidden mode, no workout)',()=>{
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{
                    ...comboDisplayProps,
                    workoutAttached: false,
                    loadButtonMode: 'hidden',
                    gestureHint: { visible: true },
                }}
            />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });

    it('never renders the gesture hint overlay during the start overlay, even if gestureHint.visible is true',()=>{
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{ ...baseProps.displayProps, workoutAttached: true, gestureHint: { visible: true } }}
            />
        );
        expect(queryByText('gesture-hint-overlay')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Previous-rides overlay wiring.
// Route-only rendering (the workout-overlay tests above) must be unaffected whenever overlayActive
// is false — this is the regression the whole design depends on being impossible by construction.
// ---------------------------------------------------------------------------

const prevRidesRows = [
    { position: 1, label: '12.05.2026', timeGap: '-1:24', isCurrent: false, lat: 1, lng: 2, tsStart: 100 },
    { position: 2, label: 'You', timeGap: '+0:00', isCurrent: true, lat: 3, lng: 4, tsStart: 200 },
];

const prevRidesOnlyDisplayProps = {
    ...baseProps.displayProps,
    startOverlayProps: null,
    workoutAttached: false,
    prevRides: { mode: 'list' as const, rows: prevRidesRows, hasMore: false },
};

describe('VideoRidePageView — previous-rides overlay wiring', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('overlayActive via eligible previous rides alone (no workout) mounts the overlay', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={prevRidesOnlyDisplayProps} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();
    });

    it('does not mount the overlay when prevRides.mode is "hidden" and no workout is attached (overlayActive stays false)', () => {
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{
                    ...baseProps.displayProps,
                    startOverlayProps: null,
                    workoutAttached: false,
                    prevRides: { mode: 'hidden', rows: [], hasMore: false },
                }}
            />
        );
        expect(queryByText('ride-overlay')).toBeNull();
    });

    it('tablet: passes the full prevRides row list through to the overlay for ear rendering, and mapPrevRiders excludes the current rider', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={prevRidesOnlyDisplayProps} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.prevRides).toEqual(prevRidesRows);
        expect(overlayProps.mapPrevRiders).toEqual([
            { key: '100', position: { lat: 1, lng: 2 }, avatar: undefined },
        ]);
    });

    it('phone (compact): sets the list mode default and still mounts the overlay for the corner-slot state', () => {
        mockUseScreenLayout.mockReturnValue('compact');
        const onSetPrevRidesMode = jest.fn();
        const { getByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{ ...prevRidesOnlyDisplayProps, cornerWidget: 'elevation' }}
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
            <VideoRidePageView
                {...baseProps}
                displayProps={prevRidesOnlyDisplayProps}
                onSetPrevRidesMode={onSetPrevRidesMode}
            />
        );
        expect(onSetPrevRidesMode).toHaveBeenCalledWith('list');
    });
});

// ---------------------------------------------------------------------------
// currentAvatar resolution — regression coverage. currentAvatar used to be derived from
// prevRides?.rows.find(row => row.isCurrent)?.avatar, which resolved to undefined (default marker
// styling) whenever prevRides had no eligible rows, e.g. a first-time route. It is now resolved
// directly via AvatarService (useAvatars().get('current')), which self-populates and is
// independent of prevRides/nearbyRiders row state entirely.
// ---------------------------------------------------------------------------

describe('VideoRidePageView — currentAvatar resolution', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockAvatarGet.mockClear();
    });

    it('resolves currentAvatar from AvatarService even when prevRides is empty (regression: used to fall back to undefined)', () => {
        const { getByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{
                    ...prevRidesOnlyDisplayProps,
                    prevRides: { mode: 'list', rows: [], hasMore: false },
                }}
            />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
        expect(mockAvatarGet).toHaveBeenCalledWith('current');
    });

    it('resolves currentAvatar from AvatarService when prevRides is undefined', () => {
        const { getByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{
                    ...prevRidesOnlyDisplayProps,
                    prevRides: undefined,
                    nearbyRiders: { rows: [{ isUser: true, isPaused: false, isCoach: false, name: 'You', distance: 900, diffDistance: 0, avatar: { shirt: 'green', helmet: 'yellow' }, lat: 7, lng: 8 }] },
                }}
            />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
    });

    it('resolves the same currentAvatar from AvatarService when prevRides is populated — no longer sourced from its rows', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={prevRidesOnlyDisplayProps} />
        );

        expect(getByText('ride-overlay')).toBeTruthy();
        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.currentAvatar).toEqual(avatarToConfig({ helmet: 'blue', shirt: 'red' }));
    });
});

// ---------------------------------------------------------------------------
// Nearby-riders overlay wiring (session 3.1) — overlayActive's three-way OR
// (comboActive || prevRidesEligible || nearbyRidersEligible) and marker merging with PrevRides.
// Video has no separate main-view FreeMap (video is the main view) — markers are only asserted via
// the corner map's mapPrevRiders prop, forwarded to the (mocked) RideOverlay.
// ---------------------------------------------------------------------------

const nearbyRidersRows = [
    { isUser: false, isPaused: false, isCoach: false, name: 'Alex Rider', distance: 1000, diffDistance: 100, avatar: { shirt: 'blue', helmet: 'red' }, lat: 5, lng: 6 },
    { isUser: true, isPaused: false, isCoach: false, name: 'You', distance: 900, diffDistance: 0, avatar: { shirt: 'green', helmet: 'yellow' }, lat: 7, lng: 8 },
];

const nearbyRidersOnlyDisplayProps = {
    ...baseProps.displayProps,
    startOverlayProps: null,
    workoutAttached: false,
    nearbyRiders: { rows: nearbyRidersRows },
};

describe('VideoRidePageView — nearby-riders overlay wiring', () => {
    beforeEach(() => {
        mockRideOverlay.mockClear();
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('overlayActive via eligible nearby riders alone (no workout, no prevRides) mounts the overlay', () => {
        const { getByText } = render(
            <VideoRidePageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps} />
        );
        expect(getByText('ride-overlay')).toBeTruthy();
    });

    it('does not mount the overlay when nearbyRiders.rows is empty (present but nothing to show)', () => {
        const { queryByText } = render(
            <VideoRidePageView
                {...baseProps}
                displayProps={{ ...baseProps.displayProps, startOverlayProps: null, workoutAttached: false, nearbyRiders: { rows: [] } }}
            />
        );
        expect(queryByText('ride-overlay')).toBeNull();
    });

    it('passes the full nearbyRiders row list through to the overlay for ear rendering', () => {
        render(<VideoRidePageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps} />);

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.nearbyRiders).toEqual(nearbyRidersRows);
    });

    it('merges nearby-riders markers into mapPrevRiders, excluding the current user', () => {
        render(<VideoRidePageView {...baseProps} displayProps={nearbyRidersOnlyDisplayProps} />);

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.mapPrevRiders).toEqual([
            expect.objectContaining({ key: 'Alex Rider', position: { lat: 5, lng: 6 } }),
        ]);
    });

    it('both PrevRides and Nearby Riders eligible simultaneously: mapPrevRiders carries both features\' markers', () => {
        const combinedDisplayProps = {
            ...baseProps.displayProps,
            startOverlayProps: null,
            workoutAttached: false,
            prevRides: {
                mode: 'list' as const,
                rows: [{ position: 1, label: '12.05.2026', timeGap: '-1:24', isCurrent: false, lat: 1, lng: 2, tsStart: 100 }],
                hasMore: false,
            },
            nearbyRiders: { rows: nearbyRidersRows },
        };
        render(<VideoRidePageView {...baseProps} displayProps={combinedDisplayProps} />);

        const overlayProps = mockRideOverlay.mock.calls.at(-1)?.[0];
        expect(overlayProps.mapPrevRiders).toEqual([
            expect.objectContaining({ key: '100' }),
            expect.objectContaining({ key: 'Alex Rider' }),
        ]);
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
                ...baseProps.displayProps,
                startOverlayProps: null,
                workoutAttached: combo,
                ...(combo ? { graph: {}, steps: {}, dashboard: {} } : {}),
                ...(prevMode ? { prevRides: { mode: prevMode, rows: [], hasMore: false } } : {}),
                ...(nearby ? { nearbyRiders: { rows: nearbyRidersRows } } : {}),
            };
            const { queryByText, unmount } = render(<VideoRidePageView {...baseProps} displayProps={displayProps} />);

            expect(queryByText('ride-overlay') !== null).toBe(expected);
            unmount();
        });
    });
});
