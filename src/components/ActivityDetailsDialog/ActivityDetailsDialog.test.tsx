import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityDetailsDialog } from './ActivityDetailsDialog';

// workout-mobile-hld-phase2.md §4.2/§9.1 / workout-combo-service-design.md §3.6, §3.9 - the
// dialog reads its own page service's getActivityDetailsProps(activityId), keyed off the id of
// whatever `service.openSelected()` currently returns, and subscribes to that page service's
// 'page-update' so the in-dialog '[x]' clear is reflected without a remount.

const mockPageObserver = { on: jest.fn(), off: jest.fn() };
const mockOnClearWorkoutSelection = jest.fn();
const mockGetActivityDetailsProps = jest.fn();

const mockPageService = {
    getActivityDetailsProps: mockGetActivityDetailsProps,
    getPageObserver: jest.fn(() => mockPageObserver),
    onClearWorkoutSelection: mockOnClearWorkoutSelection,
};

const mockActivityObserver = { on: jest.fn(), off: jest.fn() };

const baseDisplayProps: any = {
    title: 'Test Ride',
    distance: 10000,
    duration: 3600,
    elevation: 500,
    started: new Date(),
    showMap: false,
    activity: { id: 'a1', title: 'Test Ride', startTime: new Date().toISOString(), logs: [] },
    exports: [],
    canStart: true,
    canOpen: true,
    uploads: [],
    units: {},
};

const mockOpenSelected = jest.fn(() => baseDisplayProps);

const mockActivityListService = {
    openSelected: mockOpenSelected,
    closeSelected: jest.fn(),
    getObserver: jest.fn(() => mockActivityObserver),
    rideAgain: jest.fn().mockResolvedValue({ canStart: false }),
    upload: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    useActivityList: () => mockActivityListService,
    getActivitiesPageService: () => mockPageService,
    useUserSettings: () => ({ getValue: jest.fn(() => undefined) }),
    formatTime: jest.fn((v: number) => `${Math.floor(v / 60)}min`),
    useUnitConverter: jest.fn(() => ({
        convert: jest.fn((v: number) => v),
        getUnit: jest.fn(() => 'km'),
    })),
}));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: () => 'normal',
}));

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }));
jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: { writeFile: jest.fn(), copyFile: jest.fn(), CachesDirectoryPath: '/tmp' },
}));
jest.mock('react-native-mmkv', () => ({ createMMKV: jest.fn(() => ({ getString: jest.fn() })) }));

describe('ActivityDetailsDialog - workout attachment (workout-mobile-hld-phase2.md §4.2)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOpenSelected.mockReturnValue(baseDisplayProps);
        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: null,
            comboEnabled: true,
        });
    });

    it('calls getActivityDetailsProps with the currently-open activity id', () => {
        render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(mockGetActivityDetailsProps).toHaveBeenCalledWith('a1');
    });

    it('shows "Add Workout" when comboEnabled is true, canStart is true, nothing attached', () => {
        const { getByText } = render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(getByText('Add Workout')).toBeTruthy();
    });

    it('shows the chip and calls onClearWorkoutSelection when [x] is pressed', () => {
        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
            comboEnabled: true,
        });
        const { getByText, getByLabelText } = render(
            <ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />
        );
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();
        fireEvent.press(getByLabelText('Clear workout'));
        expect(mockOnClearWorkoutSelection).toHaveBeenCalledTimes(1);
    });

    it('hides "Add Workout" on a workout-only activity (canStart false)', () => {
        mockOpenSelected.mockReturnValue({ ...baseDisplayProps, canStart: false });
        const { queryByText } = render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(queryByText('Add Workout')).toBeNull();
    });

    it('subscribes to the page service page-update observer on mount and unsubscribes on unmount', () => {
        const { unmount } = render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(mockPageObserver.on).toHaveBeenCalledWith('page-update', expect.any(Function));
        unmount();
        expect(mockPageObserver.off).toHaveBeenCalledWith('page-update', expect.any(Function));
    });

    it('re-reads getActivityDetailsProps on a page-update (the chip clears without a remount)', () => {
        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
            comboEnabled: true,
        });
        const { getByText, queryByText } = render(
            <ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />
        );
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();

        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: null,
            comboEnabled: true,
        });
        const refreshHandler = mockPageObserver.on.mock.calls.find(([event]) => event === 'page-update')?.[1];
        act(() => {
            refreshHandler?.();
        });

        expect(queryByText(/^Workout:/)).toBeNull();
        expect(getByText('Add Workout')).toBeTruthy();
    });
});
