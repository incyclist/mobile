import { EventEmitter } from 'events';
import { renderHook, act } from '@testing-library/react-native';
import { useScheduledWorkoutPrompt } from './useScheduledWorkoutPrompt';

const mockNavigate = jest.fn();

// Fake prompt page service: the once-per-session guard and the calendar lookup live in the
// service, so here `show` just returns what the service would decide.
class FakePromptService extends EventEmitter {
    show = jest.fn();
    onYes = jest.fn((prompt: any) => ({ page: 'workouts', autoOpenDetailsId: prompt.workoutId }));
    onNo = jest.fn();
    onCheckWorkouts = jest.fn(() => ({ page: 'workouts' }));
}
let mockService: FakePromptService;

jest.mock('incyclist-services', () => ({
    getScheduledWorkoutPromptPageService: () => mockService,
}));

jest.mock('../../services', () => ({
    navigate: (...args: any[]) => mockNavigate(...args),
}));

const PROMPT = { title: 'VO2 Max Intervals', workoutId: 'workout-42' };

describe('useScheduledWorkoutPrompt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockService = new FakePromptService();
    });

    it('shows nothing when no workout is scheduled today', () => {
        mockService.show.mockReturnValue(null);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();
    });

    it('shows the prompt immediately when a workout is already scheduled at mount', () => {
        mockService.show.mockReturnValue(PROMPT);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toEqual({ title: 'VO2 Max Intervals' });
    });

    it('sets the once-per-session guard as soon as the prompt is triggered', () => {
        // the guard is owned by the service: the hook must ask the service exactly once at mount
        mockService.show.mockReturnValue(PROMPT);
        renderHook(() => useScheduledWorkoutPrompt());
        expect(mockService.show).toHaveBeenCalledTimes(1);
    });

    it('does not show the prompt again once the guard is already set', () => {
        // service returns null once its guard is set
        mockService.show.mockReturnValue(null);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();
    });

    it('reacts to the calendar emitting "scheduled" after mount (async preload arrival)', () => {
        mockService.show.mockReturnValue(null);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());
        expect(result.current.prompt).toBeNull();

        mockService.show.mockReturnValue(PROMPT);
        act(() => {
            mockService.emit('scheduled', PROMPT);
        });

        expect(result.current.prompt).toEqual({ title: 'VO2 Max Intervals' });
    });

    it('does nothing while disabled (enabled=false), even with a workout scheduled and no guard', () => {
        mockService.show.mockReturnValue(PROMPT);
        const { result } = renderHook(() => useScheduledWorkoutPrompt(false));
        expect(result.current.prompt).toBeNull();
        expect(mockService.show).not.toHaveBeenCalled();
        expect(mockService.listenerCount('scheduled')).toBe(0);
    });

    it('onYes navigates to workouts with the workout content id (not the calendar entry id) and clears the prompt', () => {
        mockService.show.mockReturnValue(PROMPT);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onYes();
        });

        expect(mockNavigate).toHaveBeenCalledWith('workouts', { autoOpenDetailsId: 'workout-42' });
        expect(result.current.prompt).toBeNull();
    });

    it('onNo just dismisses without navigating', () => {
        mockService.show.mockReturnValue(PROMPT);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onNo();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.prompt).toBeNull();
    });

    it('onCheckWorkouts navigates to workouts with no auto-open param and dismisses', () => {
        mockService.show.mockReturnValue(PROMPT);
        const { result } = renderHook(() => useScheduledWorkoutPrompt());

        act(() => {
            result.current.onCheckWorkouts();
        });

        expect(mockNavigate).toHaveBeenCalledWith('workouts');
        expect(result.current.prompt).toBeNull();
    });
});
