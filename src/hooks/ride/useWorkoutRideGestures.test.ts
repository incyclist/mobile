import { renderHook, act } from '@testing-library/react-native';
import { Platform, Vibration } from 'react-native';
import {
    useWorkoutRideGestures,
    classifySwipe,
    formatPowerAdjustment,
    DEFAULT_WORKOUT_LOAD_INCREMENT,
    WORKOUT_LOAD_INCREMENT_SETTING_KEY,
} from './useWorkoutRideGestures';

const mockOnStepBack = jest.fn();
const mockOnStepForward = jest.fn();
const mockAdjustLoad = jest.fn();
const mockGetValue = jest.fn((_key: string, def: any) => def);
const mockGetVersion = jest.fn(() => '1.0.19');

jest.mock('react-native-device-info', () => ({
    getVersion: () => mockGetVersion(),
}));

// Single factory (FIXES_BACKLOG #24) - useWorkoutRideGestures now calls getRidePageService(),
// same as every other ride page consumer; it always resolves to the workout-shaped service here.
jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
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

describe('formatPowerAdjustment', () => {
    it('labels an FTP adjustment with "FTP:"', () => {
        expect(formatPowerAdjustment({ type: 'ftp', value: 220 })).toBe(' (FTP: 220W)');
    });

    it('shows a target-power adjustment as a bare watt value, no label', () => {
        expect(formatPowerAdjustment({ type: 'targetPower', value: 155 })).toBe(' (155W)');
    });

    it('rounds a fractional watt value to the nearest whole number', () => {
        expect(formatPowerAdjustment({ type: 'ftp', value: 254.6 })).toBe(' (FTP: 255W)');
    });

    it('returns an empty string when the result is undefined', () => {
        expect(formatPowerAdjustment(undefined)).toBe('');
    });

    it('returns an empty string when the value is NaN', () => {
        expect(formatPowerAdjustment({ type: 'ftp', value: NaN })).toBe('');
    });
});

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
        mockAdjustLoad.mockReturnValue(undefined);
        mockGetVersion.mockReturnValue('1.0.19');
        Platform.OS = 'ios';
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

    // regression: real devices can throw SecurityException/other native errors out of
    // Vibration.vibrate() (e.g. a missing VIBRATE permission) - that must never take the
    // in-progress ride's gesture handling down with it.
    it('still performs the action and shows feedback when Vibration.vibrate() throws', () => {
        jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {
            throw new Error('vibrate: Neither user 10465 nor current process has android.permission.VIBRATE.');
        });
        const { result } = renderHook(() => useWorkoutRideGestures());

        expect(() => {
            act(() => {
                capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
            });
        }).not.toThrow();

        expect(mockOnStepBack).toHaveBeenCalledTimes(1);
        expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
    });

    // regression: older Android installs on this hot-updated bundle predate the VIBRATE manifest
    // permission (added in 1.0.19) - calling Vibration.vibrate() there crashes the app, so it must
    // be skipped based on the real installed native version, not the JS-bundled app.json version.
    it('skips vibration on Android when the installed native version predates the VIBRATE permission', () => {
        Platform.OS = 'android';
        mockGetVersion.mockReturnValue('1.0.18');
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        const { result } = renderHook(() => useWorkoutRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(vibrateSpy).not.toHaveBeenCalled();
        expect(mockOnStepBack).toHaveBeenCalledTimes(1);
        expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
    });

    it('still vibrates on Android once the installed native version has the VIBRATE permission', () => {
        Platform.OS = 'android';
        mockGetVersion.mockReturnValue('1.0.19');
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        const { result } = renderHook(() => useWorkoutRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(vibrateSpy).toHaveBeenCalled();
        expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
    });

    it('always vibrates on iOS regardless of version, since only Android requires the manifest permission', () => {
        Platform.OS = 'ios';
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        renderHook(() => useWorkoutRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(vibrateSpy).toHaveBeenCalled();
    });

    it('steps forward on a right swipe', () => {
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
        });
        expect(mockOnStepForward).toHaveBeenCalledTimes(1);
        expect(result.current.feedback.message).toBe('Step Forward ▶');
    });

    it('increases load by the configured increment on an upward swipe and shows the adjusted Workout FTP, labelled', () => {
        mockGetValue.mockImplementation(() => 5);
        mockAdjustLoad.mockReturnValue({ type: 'ftp', value: 220 });
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(mockGetValue).toHaveBeenCalledWith(WORKOUT_LOAD_INCREMENT_SETTING_KEY, DEFAULT_WORKOUT_LOAD_INCREMENT);
        expect(mockAdjustLoad).toHaveBeenCalledWith(5);
        expect(result.current.feedback.message).toBe('+5% (FTP: 220W)');
    });

    it('decreases load by the configured increment on a downward swipe and shows the adjusted Workout FTP, labelled', () => {
        mockGetValue.mockImplementation(() => 1);
        mockAdjustLoad.mockReturnValue({ type: 'ftp', value: 91 });
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: 100, velocityX: 0, velocityY: 0 });
        });
        expect(mockAdjustLoad).toHaveBeenCalledWith(-1);
        expect(result.current.feedback.message).toBe('-1% (FTP: 91W)');
    });

    // Regression: a step that allows a power range (e.g. 120-170W) nudges targetPower directly,
    // without touching FTP - feedback must show the plain Watts value, with no "FTP:" label, since
    // it isn't the workout's FTP that moved.
    it('shows a range-step target power adjustment as a bare watt value, no FTP label', () => {
        mockGetValue.mockImplementation(() => 1);
        mockAdjustLoad.mockReturnValue({ type: 'targetPower', value: 155 });
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+1% (155W)');
    });

    // The hook must show whatever adjustLoad() returns verbatim - it must not re-derive Watts itself.
    it('shows a fractional adjusted value rounded to a whole number', () => {
        mockGetValue.mockImplementation(() => 1);
        mockAdjustLoad.mockReturnValue({ type: 'ftp', value: 154.6 });
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+1% (FTP: 155W)');
    });

    it('falls back to a bare percentage when adjustLoad cannot report an adjustment (e.g. no FTP configured)', () => {
        mockGetValue.mockImplementation(() => 5);
        mockAdjustLoad.mockReturnValue(undefined);
        const { result } = renderHook(() => useWorkoutRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+5%');
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
