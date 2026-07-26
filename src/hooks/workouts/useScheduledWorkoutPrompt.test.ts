import { EventEmitter } from 'events';
import { renderHook, act } from '@testing-library/react-native';
import { useScheduledWorkoutPrompt } from './useScheduledWorkoutPrompt';

const mockNavigate = jest.fn();

let appStateStore: Record<string, any>;
const mockGetState = jest.fn((key: string) => appStateStore[key]);
const mockSetState = jest.fn((key: string, value: any) => {
    if (value === null) delete appStateStore[key];
    else appStateStore[key] = value;
});
let mockHasFeature = jest.fn(() => true);

class FakeWorkoutCalendar extends EventEmitter {
    getScheduledToday = jest.fn();
}
let mockCalendar: FakeWorkoutCalendar;

jest.mock('incyclist-services', () => ({
    useAppState: () => ({ getState: mockGetState, setState: mockSetState, hasFeature: mockHasFeature }),
    useWorkoutCalendar: () => mockCalendar,
}));

jest.mock('../../services', () => ({
    navigate: (...args: any[]) => mockNavigate(...args),
}));

jest.mock('../logging', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
}));

const SCHEDULED = {
    id: 'intervals:cal-entry-99',      // calendar-entry composite id - must NOT be what's navigated with
    name: 'VO2 Max Intervals',
    type: 'scheduled',
    workoutId: 'workout-42',
    workout: { id: 'workout-42', name: 'VO2 Max Intervals' },
};

describe('useScheduledWorkoutPrompt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        appStateStore = {};
        mockCalendar = new FakeWorkoutCalendar();
        mockHasFeature = jest.fn(() => true);
    });

    it('shows nothing when no workout is scheduled today', () => {
        mockCalendar.getScheduledToday.mockReturnValue(undefined);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();
    });

    it('shows the prompt immediately when a workout is already scheduled at mount', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toEqual({ title: 'VO2 Max Intervals' });
    });

    it('sets the once-per-session guard as soon as the prompt is triggered', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        renderHook(() => useScheduledWorkoutPrompt());
        expect(mockSetState).toHaveBeenCalledWith('scheduledPromptShown', true);
    });

    it('does not show the prompt again once the guard is already set', () => {
        appStateStore.scheduledPromptShown = true;
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();
    });

    it('reacts to the calendar emitting "scheduled" after mount (async preload arrival)', () => {
        mockCalendar.getScheduledToday.mockReturnValue(undefined);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();

        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        act(() => {
            mockCalendar.emit('scheduled', SCHEDULED);
        });

        expect(result.current.prompt).toEqual({ title: 'VO2 Max Intervals' });
    });

    it('does nothing while disabled (enabled=false), even with a workout scheduled and no guard', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt(false));
        expect(result.current.prompt).toBeNull();
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it('does nothing while the MOBILE_WORKOUTS feature toggle is off, even with a workout scheduled and no guard', () => {
        // WorkoutCalendarService is synced unconditionally at launch (preloadData()), regardless
        // of the MOBILE_WORKOUTS toggle - so without this gate the prompt would fire and its
        // Yes/Check-workouts actions would navigate to a Workouts page stuck on its "under
        // development" placeholder (WorkoutListPageService.getPageDisplayProps() short-circuits
        // to pageType:'placeholder' when the toggle is off, never rendering WorkoutDetailsDialog).
        mockHasFeature = jest.fn(() => false);
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it('onYes navigates to workouts with the workout content id (not the calendar entry id) and clears the prompt', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onYes();
        });

        expect(mockNavigate).toHaveBeenCalledWith('workouts', { autoOpenDetailsId: 'workout-42' });
        expect(result.current.prompt).toBeNull();
    });

    it('onNo just dismisses without navigating', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onNo();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.prompt).toBeNull();
    });

    it('onCheckWorkouts navigates to workouts with no auto-open param and dismisses', () => {
        mockCalendar.getScheduledToday.mockReturnValue(SCHEDULED);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onCheckWorkouts();
        });

        expect(mockNavigate).toHaveBeenCalledWith('workouts');
        expect(result.current.prompt).toBeNull();
    });
});
