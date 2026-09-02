import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RouteDetailsDialog } from './RouteDetailsDialog';

// workout-combo-service-design.md §3.5.1 "one source per state" - the whole point of this test
// file is to prove the defect it warns about can't happen: `cardProps.showWorkoutOption` is
// captured once at mount and never refreshed, while `RouteDetailsProps` (via the page service) is
// re-read on every 'page-update'. Only the latter may drive the button/chip - mixing the two
// would let a `[x]` clear hide the chip while leaving "Add Workout" permanently absent (stale
// showWorkoutOption still false).

const mockPageObserver = { on: jest.fn(), off: jest.fn() };
const mockOnClearWorkoutSelection = jest.fn();

const baseRouteDetailsProps = (overrides = {}) => ({
    routeId: 'r1',
    attachedWorkout: null,
    ...overrides,
});

const mockGetRouteDetailsProps = jest.fn(() => baseRouteDetailsProps());

const mockPageService = {
    getRouteDetailsProps: mockGetRouteDetailsProps,
    getPageObserver: jest.fn(() => mockPageObserver),
    onClearWorkoutSelection: mockOnClearWorkoutSelection,
};

const mockCardProps: any = {
    totalDistance: { value: 50, unit: 'km' },
    totalElevation: { value: 800, unit: 'm' },
    showLoopOverwrite: false,
    showNextOverwrite: false,
    // Deliberately stale/false, mirroring the "already attached at mount, never refreshed" defect
    // scenario - if a test ever sees this drive the button/chip, the "one source per state" rule
    // has been broken.
    showWorkoutOption: false,
    canStart: true,
    updateStartPos: jest.fn(),
    settings: { startPos: { value: 0, unit: 'km' }, realityFactor: 100 },
};

const mockRouteData: any = {
    description: {
        id: 'r1',
        title: 'Alblasserwaard (SD)',
        hasVideo: false,
        hasGpx: true,
        isLoop: false,
        videoFormat: undefined,
        previewUrl: undefined,
        segments: [],
        routeHash: 'hash1',
    },
    details: { points: [] },
    points: [],
};

const mockCard: any = {
    openSettings: jest.fn(() => mockCardProps),
    getData: jest.fn(() => mockRouteData),
    getCurrentDownload: jest.fn(() => null),
    changeSettings: jest.fn(),
    start: jest.fn(),
    cancel: jest.fn(),
    addWorkout: jest.fn(),
    download: jest.fn(),
};

const mockRouteListService = {
    getCard: jest.fn(() => mockCard),
    getRouteDetails: jest.fn().mockResolvedValue(undefined),
};

const mockActivityListService = {
    getPastActivitiesWithDetails: jest.fn().mockResolvedValue([]),
};

const mockOnlineStatusMonitor = { onlineStatus: true };

jest.mock('incyclist-services', () => ({
    useRouteList: () => mockRouteListService,
    useActivityList: () => mockActivityListService,
    getRoutesPageService: () => mockPageService,
    useUnitConverter: () => ({ convert: (v: number) => v, getUnit: () => 'km' }),
    getPosition: jest.fn(() => undefined),
    useOnlineStatusMonitoring: () => mockOnlineStatusMonitor,
}));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'normal',
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    Map: 'Map',
    Camera: 'Camera',
    GeoJSONSource: 'GeoJSONSource',
    Layer: 'Layer',
    ViewAnnotation: 'ViewAnnotation',
    LogManager: { onLog: jest.fn() },
    NetworkManager: { setConnected: jest.fn() },
}));

jest.mock('../SecureImage', () => ({
    SecureImage: () => null,
}));

jest.mock('../DownloadModal', () => ({
    DownloadModalView: () => null,
}));

const mockNavigate = jest.fn();
jest.mock('../../services', () => ({
    navigate: (page: string) => mockNavigate(page),
}));

describe('RouteDetailsDialog - workout attachment (workout-combo-service-design.md §3.5.1)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps());
        mockCard.openSettings.mockReturnValue(mockCardProps);
        mockOnlineStatusMonitor.onlineStatus = true;
        mockRouteData.description.videoFormat = undefined;
    });

    it('renders "Add Workout" driven only by RouteDetailsProps, ignoring the stale showWorkoutOption=false', () => {
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ attachedWorkout: null }));
        const { getByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Add Workout')).toBeTruthy();
    });

    // Regression guard, session 5.2 PR review (2026-08-12): a prior revision attached the workout
    // (card.addWorkout()) but never navigated to Workouts, leaving the user on the Route dialog
    // with no visible next step - the only one of the three dialogs missing this.
    it('pressing "Add Workout" applies settings, attaches the workout, and navigates to workouts', () => {
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ attachedWorkout: null }));
        const { getByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        fireEvent.press(getByText('Add Workout'));
        expect(mockCard.changeSettings).toHaveBeenCalledTimes(1);
        expect(mockCard.addWorkout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('workouts');
    });

    it('renders the "Workout: <name>" chip when a workout is attached', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();
        expect(queryByText('Add Workout')).toBeNull();
    });

    it('subscribes to the page service page-update observer on mount and unsubscribes on unmount', () => {
        const { unmount } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(mockPageObserver.on).toHaveBeenCalledWith('page-update', expect.any(Function));
        unmount();
        expect(mockPageObserver.off).toHaveBeenCalledWith('page-update', expect.any(Function));
    });

    it('calls pageService.onClearWorkoutSelection when the chip [x] is pressed', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        const { getByLabelText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        fireEvent.press(getByLabelText('Clear workout'));
        expect(mockOnClearWorkoutSelection).toHaveBeenCalledTimes(1);
    });

    it('reacts to a page-update by re-reading getRouteDetailsProps - "Add Workout" reappears after a clear, not stuck absent by the stale cardProps.showWorkoutOption', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();

        // Simulate the clear: page service now reports no attached workout, and fires 'page-update'
        // - exactly what onClearWorkoutSelection() does in the real service.
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ attachedWorkout: null }));
        const refreshHandler = mockPageObserver.on.mock.calls.find(([event]) => event === 'page-update')?.[1];
        act(() => {
            refreshHandler?.();
        });

        expect(queryByText(/^Workout:/)).toBeNull();
        // The stale cardProps.showWorkoutOption (captured once at mount, still false) must NOT
        // suppress "Add Workout" - it comes back because RouteDetailsProps is the only source.
        expect(getByText('Add Workout')).toBeTruthy();
    });
});

// `RouteCard.canStart()` conflates the AVI-unsupported and offline cases into one boolean, so
// `canNotStartReason` needs its own offline read (`useOnlineStatusMonitoring().onlineStatus`)
// alongside the pre-existing AVI check. Covers all four combinations explicitly, including which
// reason wins when both apply.
describe('RouteDetailsDialog - canNotStartReason (AVI vs offline)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps());
        mockCard.openSettings.mockReturnValue(mockCardProps);
        mockOnlineStatusMonitor.onlineStatus = true;
        mockRouteData.description.videoFormat = undefined;
    });

    it('online + not-AVI: no reason shown, Start enabled', () => {
        mockOnlineStatusMonitor.onlineStatus = true;
        mockRouteData.description.videoFormat = undefined;
        const { queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(queryByText('AVI videos are not supported on mobile')).toBeNull();
        expect(queryByText('You are offline (no network)')).toBeNull();
    });

    it('online + AVI: shows the AVI reason', () => {
        mockOnlineStatusMonitor.onlineStatus = true;
        mockRouteData.description.videoFormat = 'avi';
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('AVI videos are not supported on mobile')).toBeTruthy();
        expect(queryByText('You are offline (no network)')).toBeNull();
    });

    it('offline + not-AVI: shows the offline reason', () => {
        mockOnlineStatusMonitor.onlineStatus = false;
        mockRouteData.description.videoFormat = undefined;
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('You are offline (no network)')).toBeTruthy();
        expect(queryByText('AVI videos are not supported on mobile')).toBeNull();
    });

    it('offline + AVI: AVI reason wins (checked first), offline reason is not shown', () => {
        mockOnlineStatusMonitor.onlineStatus = false;
        mockRouteData.description.videoFormat = 'avi';
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('AVI videos are not supported on mobile')).toBeTruthy();
        expect(queryByText('You are offline (no network)')).toBeNull();
    });
});
