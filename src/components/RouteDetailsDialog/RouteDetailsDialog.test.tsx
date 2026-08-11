import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RouteDetailsDialog } from './RouteDetailsDialog';

// workout-combo-service-design.md §3.5.1 "one source per state" - the whole point of this test
// file is to prove the defect it warns about can't happen: `cardProps.showWorkoutOption` is
// captured once at mount and never refreshed, while `RouteDetailsProps` (via the page service) is
// re-read on every 'page-update'. When comboEnabled is true, only the latter may drive the
// button/chip - mixing the two would let a `[x]` clear hide the chip while leaving "Add Workout"
// permanently absent (stale showWorkoutOption still false).

const mockPageObserver = { on: jest.fn(), off: jest.fn() };
const mockOnClearWorkoutSelection = jest.fn();

const baseRouteDetailsProps = (overrides = {}) => ({
    routeId: 'r1',
    attachedWorkout: null,
    comboEnabled: true,
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
    // scenario - if a test ever sees this drive the button/chip while comboEnabled is true, the
    // "one source per state" rule has been broken.
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

jest.mock('incyclist-services', () => ({
    useRouteList: () => mockRouteListService,
    useActivityList: () => mockActivityListService,
    getRoutesPageService: () => mockPageService,
    useUnitConverter: () => ({ convert: (v: number) => v, getUnit: () => 'km' }),
    getPosition: jest.fn(() => undefined),
}));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'normal',
}));

jest.mock('@maplibre/maplibre-react-native', () => ({
    MapView: 'MapView',
    Camera: 'Camera',
    ShapeSource: 'ShapeSource',
    LineLayer: 'LineLayer',
    setAccessToken: jest.fn(),
    default: { createFragment: jest.fn() },
}));

jest.mock('../SecureImage', () => ({
    SecureImage: () => null,
}));

jest.mock('../DownloadModal', () => ({
    DownloadModalView: () => null,
}));

describe('RouteDetailsDialog - workout attachment (workout-combo-service-design.md §3.5.1)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps());
        mockCard.openSettings.mockReturnValue(mockCardProps);
    });

    it('renders "Add Workout" driven only by RouteDetailsProps when comboEnabled is true, ignoring the stale showWorkoutOption=false', () => {
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ comboEnabled: true, attachedWorkout: null }));
        const { getByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Add Workout')).toBeTruthy();
    });

    it('renders the "Workout: <name>" chip when comboEnabled is true and a workout is attached', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ comboEnabled: true, attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
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
            baseRouteDetailsProps({ comboEnabled: true, attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        const { getByLabelText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        fireEvent.press(getByLabelText('Clear workout'));
        expect(mockOnClearWorkoutSelection).toHaveBeenCalledTimes(1);
    });

    it('reacts to a page-update by re-reading getRouteDetailsProps - "Add Workout" reappears after a clear, not stuck absent by the stale cardProps.showWorkoutOption', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ comboEnabled: true, attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();

        // Simulate the clear: page service now reports no attached workout, and fires 'page-update'
        // - exactly what onClearWorkoutSelection() does in the real service.
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ comboEnabled: true, attachedWorkout: null }));
        const refreshHandler = mockPageObserver.on.mock.calls.find(([event]) => event === 'page-update')?.[1];
        act(() => {
            refreshHandler?.();
        });

        expect(queryByText(/^Workout:/)).toBeNull();
        // The stale cardProps.showWorkoutOption (captured once at mount, still false) must NOT
        // suppress "Add Workout" - it comes back because comboEnabled routes it through
        // RouteDetailsProps only.
        expect(getByText('Add Workout')).toBeTruthy();
    });

    it('renders today\'s shipped "Start with Workout" label, driven only by cardProps.showWorkoutOption, when comboEnabled is false', () => {
        mockGetRouteDetailsProps.mockReturnValue(baseRouteDetailsProps({ comboEnabled: false, attachedWorkout: null }));
        mockCard.openSettings.mockReturnValue({ ...mockCardProps, showWorkoutOption: true });
        const { getByText, queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(getByText('Start with Workout')).toBeTruthy();
        expect(queryByText('Add Workout')).toBeNull();
    });

    it('ignores attachedWorkout entirely when comboEnabled is false (no chip even if RouteDetailsProps reports one attached)', () => {
        mockGetRouteDetailsProps.mockReturnValue(
            baseRouteDetailsProps({ comboEnabled: false, attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' } })
        );
        mockCard.openSettings.mockReturnValue({ ...mockCardProps, showWorkoutOption: false });
        const { queryByText } = render(<RouteDetailsDialog routeId="r1" onStart={jest.fn()} />);
        expect(queryByText(/^Workout:/)).toBeNull();
        expect(queryByText('Add Workout')).toBeNull();
        expect(queryByText('Start with Workout')).toBeNull();
    });
});
