import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityDetailsDialog } from './ActivityDetailsDialog';
import { navigate } from '../../services';

const mockNavigate = navigate as jest.Mock;

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
const mockCard = { addWorkout: jest.fn() };
const mockOpenRoute = jest.fn(() => mockCard);

const mockActivityListService = {
    openSelected: mockOpenSelected,
    closeSelected: jest.fn(),
    getObserver: jest.fn(() => mockActivityObserver),
    rideAgain: jest.fn().mockResolvedValue({ canStart: false }),
    upload: jest.fn(),
    openRoute: mockOpenRoute,
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

jest.mock('../../services', () => ({
    navigate: jest.fn(),
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
        });
    });

    it('calls getActivityDetailsProps with the currently-open activity id', () => {
        render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(mockGetActivityDetailsProps).toHaveBeenCalledWith('a1');
    });

    it('shows "Add Workout" when canStart is true, nothing attached', () => {
        const { getByText } = render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(getByText('Add Workout')).toBeTruthy();
    });

    it('shows the chip and calls onClearWorkoutSelection when [x] is pressed', () => {
        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
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

    // Session 5.2 wiring (workout-combo-service-design.md §2/§3.9): the "Add Workout" click
    // resolves the activity to its RouteCard and attaches the workout to *that* route.
    it('calls openRoute(), card.addWorkout() and navigates to workouts on "Add Workout" click', () => {
        const { getByText } = render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        fireEvent.press(getByText('Add Workout'));
        expect(mockOpenRoute).toHaveBeenCalledTimes(1);
        expect(mockCard.addWorkout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('workouts');
    });

    // D4 regression guard #1 (session 5.2 brief): the select-and-navigate recipe must run only
    // inside the click handler, never eagerly on mount - an eager call would silently overwrite an
    // already-attached route (e.g. Route A "Add Workout"-ed earlier) the instant this dialog opens
    // for an activity whose own route is B, even before the user decides anything.
    it('does not call openRoute() merely from mounting the dialog - only the click does', () => {
        render(<ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />);
        expect(mockOpenRoute).not.toHaveBeenCalled();
        expect(mockCard.addWorkout).not.toHaveBeenCalled();
    });

    // D4 regression guard #2: Close must not touch route selection at all, so a route attached
    // before this dialog opened (Route A "Add Workout") survives a Close/Cancel on this dialog.
    it('does not call openRoute() when Close is pressed - a previously attached route is left untouched', () => {
        const onClose = jest.fn();
        const { getByText } = render(<ActivityDetailsDialog onClose={onClose} onRideAgain={jest.fn()} />);
        fireEvent.press(getByText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockOpenRoute).not.toHaveBeenCalled();
        expect(mockCard.addWorkout).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('re-reads getActivityDetailsProps on a page-update (the chip clears without a remount)', () => {
        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
        });
        const { getByText, queryByText } = render(
            <ActivityDetailsDialog onClose={jest.fn()} onRideAgain={jest.fn()} />
        );
        expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();

        mockGetActivityDetailsProps.mockReturnValue({
            activityId: 'a1',
            attachedWorkout: null,
        });
        const refreshHandler = mockPageObserver.on.mock.calls.find(([event]) => event === 'page-update')?.[1];
        act(() => {
            refreshHandler?.();
        });

        expect(queryByText(/^Workout:/)).toBeNull();
        expect(getByText('Add Workout')).toBeTruthy();
    });
});
