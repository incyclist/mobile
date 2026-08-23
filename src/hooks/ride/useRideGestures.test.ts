import { renderHook, act } from '@testing-library/react-native';
import { Platform, Vibration } from 'react-native';
import {
    useRideGestures,
    classifySwipe,
    formatPowerAdjustment,
    formatSwipeFeedback,
    DEFAULT_WORKOUT_LOAD_INCREMENT,
    WORKOUT_LOAD_INCREMENT_SETTING_KEY,
    LARGE_LOAD_INCREMENT,
} from './useRideGestures';

const mockOnStepBack = jest.fn();
const mockOnStepForward = jest.fn();
const mockAdjustLoad = jest.fn();
const mockGetLoadButtonMode = jest.fn(() => 'power');
// Defaults true - this hook was originally only wired to the Workout ride screen (always
// workout-attached); tests below that exercise a plain GPX/Video ride override it to false.
const mockIsWorkoutAttached = jest.fn(() => true);
const mockGetValue = jest.fn((_key: string, def: any) => def);
const mockGetVersion = jest.fn(() => '1.0.19');

jest.mock('react-native-device-info', () => ({
    getVersion: () => mockGetVersion(),
}));

// Single factory (FIXES_BACKLOG #24) - useRideGestures now calls getRidePageService(),
// same as every other ride page consumer; it always resolves to the workout-shaped service here.
jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        onStepBack: mockOnStepBack,
        onStepForward: mockOnStepForward,
        adjustLoad: mockAdjustLoad,
        getLoadButtonMode: mockGetLoadButtonMode,
        isWorkoutAttached: mockIsWorkoutAttached,
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

// FIXES_BACKLOG #37: in SIM/Resistance mode with virtual shifting enabled, adjustLoad() performs a
// gear shift instead of a power/FTP nudge - the swipe feedback must say so.
describe('formatSwipeFeedback', () => {
    it('shows a gear-shift result as "+N gear", not a "%" power adjustment', () => {
        expect(formatSwipeFeedback('+', 1, { type: 'gear', value: 1 })).toBe('+1 gear');
    });

    it('shows a gear-shift-down result as "-N gear"', () => {
        expect(formatSwipeFeedback('-', 5, { type: 'gear', value: -5 })).toBe('-5 gear');
    });

    it('falls back to the existing "%"-based message for power-mode results', () => {
        expect(formatSwipeFeedback('+', 5, { type: 'ftp', value: 220 })).toBe('+5% (FTP: 220W)');
    });

    it('falls back to the existing "%"-based message when there is no result at all', () => {
        expect(formatSwipeFeedback('+', 5, undefined)).toBe('+5%');
    });

    // Regression: a plain (no-workout) ERG-mode ride's swipe reports {type:'targetPower', value:NaN}
    // (RideDisplayService.adjustDevicePower() can't know the resulting absolute Watts, only the
    // delta it sent) - the toast previously fell through to the "%" branch and showed e.g. "+1%"
    // even though the actual change was "+5W", since there is no FTP/range for "%" to mean anything.
    it('shows the nominal 5W step for a plain ERG-mode adjustment (magnitude 1), not "+1%"', () => {
        expect(formatSwipeFeedback('+', 1, { type: 'targetPower', value: NaN })).toBe('+5W');
    });

    it('shows the nominal 50W step for a plain ERG-mode adjustment at any other magnitude', () => {
        expect(formatSwipeFeedback('-', 5, { type: 'targetPower', value: NaN })).toBe('-50W');
    });

    it('still uses the "%"-based message for a workout in-range nudge (targetPower with a real value)', () => {
        expect(formatSwipeFeedback('+', 1, { type: 'targetPower', value: 155 })).toBe('+1% (155W)');
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

describe('useRideGestures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetValue.mockImplementation((_key: string, def: any) => def);
        mockAdjustLoad.mockReturnValue(undefined);
        mockGetLoadButtonMode.mockReturnValue('power');
        mockIsWorkoutAttached.mockReturnValue(true);
        mockGetVersion.mockReturnValue('1.0.19');
        Platform.OS = 'ios';
        jest.useFakeTimers();
        capturedOnEnd = undefined;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('wires a Pan gesture with onEnd registered', () => {
        const { result } = renderHook(() => useRideGestures());
        expect(result.current.gesture).toBe(mockPanBuilder);
        expect(capturedOnEnd).toBeInstanceOf(Function);
    });

    it('exposes the live loadIncrement setting, never a hardcoded value', () => {
        mockGetValue.mockImplementation(() => 7);
        const { result } = renderHook(() => useRideGestures());
        expect(result.current.loadIncrement).toBe(7);
        expect(mockGetValue).toHaveBeenCalledWith(WORKOUT_LOAD_INCREMENT_SETTING_KEY, DEFAULT_WORKOUT_LOAD_INCREMENT);
    });

    it('falls back to the default loadIncrement when no setting is stored', () => {
        const { result } = renderHook(() => useRideGestures());
        expect(result.current.loadIncrement).toBe(DEFAULT_WORKOUT_LOAD_INCREMENT);
    });

    it('steps back on a left swipe, vibrates, and shows feedback', () => {
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        const { result } = renderHook(() => useRideGestures());

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
        const { result } = renderHook(() => useRideGestures());

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
        const { result } = renderHook(() => useRideGestures());

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
        const { result } = renderHook(() => useRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(vibrateSpy).toHaveBeenCalled();
        expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
    });

    it('always vibrates on iOS regardless of version, since only Android requires the manifest permission', () => {
        Platform.OS = 'ios';
        const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
        renderHook(() => useRideGestures());

        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });

        expect(vibrateSpy).toHaveBeenCalled();
    });

    it('steps forward on a right swipe', () => {
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
        });
        expect(mockOnStepForward).toHaveBeenCalledTimes(1);
        expect(result.current.feedback.message).toBe('Step Forward ▶');
    });

    it('increases load by the configured increment on an upward swipe and shows the adjusted Workout FTP, labelled', () => {
        mockGetValue.mockImplementation(() => 5);
        mockAdjustLoad.mockReturnValue({ type: 'ftp', value: 220 });
        const { result } = renderHook(() => useRideGestures());
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
        const { result } = renderHook(() => useRideGestures());
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
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+1% (155W)');
    });

    // The hook must show whatever adjustLoad() returns verbatim - it must not re-derive Watts itself.
    it('shows a fractional adjusted value rounded to a whole number', () => {
        mockGetValue.mockImplementation(() => 1);
        mockAdjustLoad.mockReturnValue({ type: 'ftp', value: 154.6 });
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+1% (FTP: 155W)');
    });

    it('falls back to a bare percentage when adjustLoad cannot report an adjustment (e.g. no FTP configured)', () => {
        mockGetValue.mockImplementation(() => 5);
        mockAdjustLoad.mockReturnValue(undefined);
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.message).toBe('+5%');
    });

    it('does not call any service method or show feedback below both thresholds', () => {
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: 5, translationY: 5, velocityX: 10, velocityY: 10 });
        });
        expect(mockOnStepBack).not.toHaveBeenCalled();
        expect(mockOnStepForward).not.toHaveBeenCalled();
        expect(mockAdjustLoad).not.toHaveBeenCalled();
        expect(result.current.feedback.visible).toBe(false);
    });

    it('auto-dismisses the feedback flash after its duration', () => {
        const { result } = renderHook(() => useRideGestures());
        act(() => {
            capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
        });
        expect(result.current.feedback.visible).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1200);
        });
        expect(result.current.feedback).toEqual({ visible: false, message: '' });
    });

    // FIXES_BACKLOG #37: SIM/Resistance mode with virtual shifting enabled - swipe up/down performs
    // a gear shift (WorkoutRideService.gearChange(), reached via adjustLoad()) instead of a
    // power/FTP nudge, and the feedback must say "gear", not "%".
    describe('loadButtonMode="gear" (SIM/Resistance, virtual shifting enabled)', () => {
        beforeEach(() => {
            mockGetLoadButtonMode.mockReturnValue('gear');
        });

        it('still calls adjustLoad on an upward swipe (routing to gear shift happens in the service layer)', () => {
            mockGetValue.mockImplementation(() => 1);
            mockAdjustLoad.mockReturnValue({ type: 'gear', value: 1 });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).toHaveBeenCalledWith(1);
            expect(result.current.feedback.message).toBe('+1 gear');
        });

        it('shows "-N gear" feedback on a downward swipe', () => {
            mockGetValue.mockImplementation(() => 5);
            mockAdjustLoad.mockReturnValue({ type: 'gear', value: -5 });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 0, translationY: 100, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).toHaveBeenCalledWith(-5);
            expect(result.current.feedback.message).toBe('-5 gear');
        });

        it('still vibrates and steps back/forward normally - only the load-adjust feedback text changes', () => {
            const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
            });

            expect(vibrateSpy).toHaveBeenCalled();
            expect(mockOnStepBack).toHaveBeenCalledTimes(1);
            expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });
        });
    });

    // FIXES_BACKLOG #37: SIM/Resistance mode with virtual shifting disabled - there is no gear
    // concept and no power target to nudge, so the load-adjust gesture is disabled outright (no
    // service call, no vibration, no feedback) rather than showing a misleading "no effect" toast.
    describe('loadButtonMode="hidden" (SIM/Resistance, virtual shifting disabled)', () => {
        beforeEach(() => {
            mockGetLoadButtonMode.mockReturnValue('hidden');
        });

        it('ignores an upward swipe entirely: no adjustLoad call, no vibration, no feedback', () => {
            const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).not.toHaveBeenCalled();
            expect(vibrateSpy).not.toHaveBeenCalled();
            expect(result.current.feedback).toEqual({ visible: false, message: '' });
        });

        it('ignores a downward swipe entirely', () => {
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 0, translationY: 100, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).not.toHaveBeenCalled();
            expect(result.current.feedback.visible).toBe(false);
        });

        it('leaves step back/forward (left/right swipes) unaffected', () => {
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
            });
            expect(mockOnStepBack).toHaveBeenCalledTimes(1);
            expect(result.current.feedback).toEqual({ visible: true, message: '◀ Step Back' });

            act(() => {
                capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
            });
            expect(mockOnStepForward).toHaveBeenCalledTimes(1);
        });
    });

    // Regression: a plain GPX/Video ride with no workout attached has nothing for left/right to
    // step through - RidePageService.onStepBack()/onStepForward() already no-op safely, but the
    // hook used to show a "Step Back"/"Step Forward" toast regardless, which was misleading when
    // nothing actually happened.
    //
    // Superseded by the "big adjustment" feature below: left/right on a plain ride now performs a
    // LARGE_LOAD_INCREMENT (5) load adjustment instead - up/down stays the fine one (the user's own
    // loadIncrement setting). Only loadButtonMode==='hidden' (no gear concept, no power target)
    // still leaves left/right fully suppressed, mirroring up/down's existing hidden-mode handling.
    describe('no workout attached (plain GPX/Video ride)', () => {
        beforeEach(() => {
            mockIsWorkoutAttached.mockReturnValue(false);
        });

        it('performs a big (LARGE_LOAD_INCREMENT) ERG-mode adjustment on a right swipe, not step-forward', () => {
            const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
            mockGetLoadButtonMode.mockReturnValue('power');
            mockAdjustLoad.mockReturnValue({ type: 'targetPower', value: NaN });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
            });

            expect(mockOnStepForward).not.toHaveBeenCalled();
            expect(mockAdjustLoad).toHaveBeenCalledWith(LARGE_LOAD_INCREMENT);
            expect(vibrateSpy).toHaveBeenCalled();
            expect(result.current.feedback.message).toBe('+50W');
        });

        it('performs a big (negative) ERG-mode adjustment on a left swipe, not step-back',()=>{
            mockGetLoadButtonMode.mockReturnValue('power');
            mockAdjustLoad.mockReturnValue({ type: 'targetPower', value: NaN });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
            });

            expect(mockOnStepBack).not.toHaveBeenCalled();
            expect(mockAdjustLoad).toHaveBeenCalledWith(-LARGE_LOAD_INCREMENT);
            expect(result.current.feedback.message).toBe('-50W');
        });

        it('performs a big (+/-5) gear adjustment on left/right when loadButtonMode is "gear"',()=>{
            mockGetLoadButtonMode.mockReturnValue('gear');
            mockAdjustLoad.mockReturnValue({ type: 'gear', value: 5 });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 100, translationY: 0, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).toHaveBeenCalledWith(LARGE_LOAD_INCREMENT);
            expect(result.current.feedback.message).toBe('+5 gear');
        });

        it('leaves left/right fully suppressed when loadButtonMode is "hidden" - no adjustLoad call, no vibration, no feedback', () => {
            mockGetLoadButtonMode.mockReturnValue('hidden');
            const vibrateSpy = jest.spyOn(Vibration, 'vibrate');
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: -100, translationY: 0, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).not.toHaveBeenCalled();
            expect(mockOnStepBack).not.toHaveBeenCalled();
            expect(vibrateSpy).not.toHaveBeenCalled();
            expect(result.current.feedback).toEqual({ visible: false, message: '' });
        });

        it('leaves up/down (the fine load-adjust swipe) unaffected', () => {
            mockGetValue.mockImplementation(() => 1);
            mockAdjustLoad.mockReturnValue({ type: 'targetPower', value: NaN });
            const { result } = renderHook(() => useRideGestures());

            act(() => {
                capturedOnEnd!({ translationX: 0, translationY: -100, velocityX: 0, velocityY: 0 });
            });

            expect(mockAdjustLoad).toHaveBeenCalledWith(1);
            expect(result.current.feedback.message).toBe('+5W');
        });
    });
});
