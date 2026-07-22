import { renderHook, act } from '@testing-library/react-native';
import { Vibration } from 'react-native';
import {
    useWorkoutRideGestures,
    classifySwipe,
    DEFAULT_WORKOUT_LOAD_INCREMENT,
    WORKOUT_LOAD_INCREMENT_SETTING_KEY,
} from './useWorkoutRideGestures';

const mockOnStepBack = jest.fn();
const mockOnStepForward = jest.fn();
const mockAdjustLoad = jest.fn();
const mockGetValue = jest.fn((_key: string, def: any) => def);

jest.mock('incyclist-services', () => ({
    getWorkoutRidePageService: () => ({
        onStepBack: mockOnStepBack,
        onStepForward: mockOnStepForward,
        adjustLoad: mockAdjustLoad,
    }),
    useUserSettings: () => ({ getValue: mockGetValue }),
}));

jest.mock('../logging', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
}));

let capturedOnEnd: ((e: { translationX: number; translationY: number; velocityX: number; velocityY: number }) => void) | undefined;
const mockPanBuilder: any = {
    minDistance: jest.fn(() => mockPanBuilder),
    onEnd: jest.fn((cb: any) => {
        capturedOnEnd = cb;
        return mockPanBuilder;
    }),
};
jest.mock('react-native-gesture-handler', () => ({
    Gesture: { Pan: jest.fn(() => mockPanBuilder) },
}));

describe('classifySwipe', () => {
    it('returns null for movement below both thresholds', () => {
        expect(classifySwipe(10, 5, 50, 50)).toBeNull();
    });

    it('detects a rightward swipe by distance', () => {
        expect(classifySwipe(80, 5, 0, 0)).toBe('right');
    });

    it('detects a leftward swipe by distance', () => {
        expect(classifySwipe(-80, 5, 0, 0)).toBe('left');
    });

    it('detects an upward swipe by velocity even with a short distance', () => {
        expect(classifySwipe(0, -20, 0, -500)).toBe('up');
    });

    it('detects a downward swipe', () => {
        expect(classifySwipe(0, 80, 0, 0)).toBe('down');
    });

    it('classifies by the dominant axis when both exceed the threshold', () => {
        expect(classifySwipe(90, 10, 0, 0)).toBe('right');
    });
});

describe('useWorkoutRideGestures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetValue.mockImplementation((_key: string, def: any) => def);
        jest.useFakeTimers();
        capturedOnEnd = undefined;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('wires a Pan gesture with onEnd registered', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        expect(result.current.gesture).toBe(mockPanBuilder);
        expect(capturedOnEnd).toBeInstanceOf(Function);
    });

    it('exposes the live loadIncrement setting, never a hardcoded value', () => {
        mockGetValue.mockImplementation(() => 7);
        const { result } = renderHook(() => useWorkoutRideGestures());
        expect(result.current.loadIncrement).toBe(7);
        expect(mockGetValue).toHaveBeenCalledWith(WORKOUT_LOAD_INCREMENT_SETTING_KEY, DEFAULT_WORKOUT_LOAD_INCREMENT);
    });

    it('falls back to the default loadIncrement when no setting is stored', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        expect(result.current.loadIncrement).toBe(DEFAULT_WORKOUT_LOAD_INCREMENT);
    });

    it('steps back on a left swipe, vibrates, and shows feedback', () => {
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        const { result } = renderHook(() => useWorkoutRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(mockOnStepBack).toHaveBeenCalledTimes(1);
        expect(vibrateSpy).toHaveBeenCalled();
        expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
    });

    it('steps forward on a right swipe', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
        });
        expect(mockOnStepForward).toHaveBeenCalledTimes(1);
        expect(result.current.feedback.message).toBe('Step Forward ▶');
    });

    it('increases load by the configured increment on an upward swipe', () => {
        mockGetValue.mockImplementation(() => 5);
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(mockGetValue).toHaveBeenCalledWith(WORKOUT_LOAD_INCREMENT_SETTING_KEY, DEFAULT_WORKOUT_LOAD_INCREMENT);
        expect(mockAdjustLoad).toHaveBeenCalledWith(5);
        expect(result.current.feedback.message).toBe('+5%');
    });

    it('decreases load by the configured increment on a downward swipe', () => {
        mockGetValue.mockImplementation(() => 1);
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: 100, velocityX: 0, velocityY: 0 });
        });
        expect(mockAdjustLoad).toHaveBeenCalledWith(-1);
        expect(result.current.feedback.message).toBe('-1%');
    });

    it('does not call any service method or show feedback below both thresholds', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 5, translationY: 5, velocityX: 10, velocityY: 10 });
        });
        expect(mockOnStepBack).not.toHaveBeenCalled();
        expect(mockOnStepForward).not.toHaveBeenCalled();
        expect(mockAdjustLoad).not.toHaveBeenCalled();
        expect(result.current.feedback.visible).toBe(false);
    });

    it('auto-dismisses the feedback flash after its duration', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.visible).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1200);
        });
        expect(result.current.feedback).toEqual({ visible: false, message: '' });
    });
});
