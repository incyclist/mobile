import { renderHook, act } from '@testing-library/react-native';
import {
    useWorkoutStepAudioSignal,
    STEP_CHANGE_AUDIO_SIGNAL_SETTING_KEY,
    DEFAULT_STEP_CHANGE_AUDIO_SIGNAL,
} from './useWorkoutStepAudioSignal';
import { STEP_COUNTDOWN_TICK_TONE, STEP_CHANGE_TONE } from '../../utils/stepChangeAudio';

const mockPlayTone = jest.fn();
jest.mock('../../utils/stepChangeAudio', () => ({
    playTone: (...args: unknown[]) => mockPlayTone(...args),
    STEP_COUNTDOWN_TICK_TONE: { frequencyHz: 2731, durationMs: 100, waveform: 'sine' },
    STEP_CHANGE_TONE: { frequencyHz: 4096, durationMs: 250, waveform: 'sine' },
}));

let capturedHandlers: Record<string, (...args: any[]) => void> = {};
const mockOn = jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; });
const mockOff = jest.fn();
const mockGetPageObserver = jest.fn(() => ({ on: mockOn, off: mockOff }));
const mockGetValue = jest.fn((_key: string, def: any) => def);

// Single factory (FIXES_BACKLOG #24) - useWorkoutStepAudioSignal calls getRidePageService(), same
// as every other ride page consumer.
jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        getPageObserver: mockGetPageObserver,
    }),
    useUserSettings: () => ({ getValue: mockGetValue }),
}));

describe('useWorkoutStepAudioSignal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedHandlers = {};
        mockGetValue.mockImplementation((_key: string, def: any) => def);
    });

    it('subscribes to step-countdown and step-changed on mount, unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useWorkoutStepAudioSignal());

        expect(mockOn).toHaveBeenCalledWith('step-countdown', expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith('step-changed', expect.any(Function));

        unmount();
        expect(mockOff).toHaveBeenCalledWith('step-countdown', expect.any(Function));
        expect(mockOff).toHaveBeenCalledWith('step-changed', expect.any(Function));
    });

    it('plays the countdown tick tone on a step-countdown event when the setting is on', () => {
        renderHook(() => useWorkoutStepAudioSignal());

        act(() => { capturedHandlers['step-countdown']({ secondsRemaining: 4 }); });

        expect(mockPlayTone).toHaveBeenCalledWith(STEP_COUNTDOWN_TICK_TONE);
        expect(mockGetValue).toHaveBeenCalledWith(STEP_CHANGE_AUDIO_SIGNAL_SETTING_KEY, DEFAULT_STEP_CHANGE_AUDIO_SIGNAL);
    });

    it('does not play the countdown tone when the setting is off', () => {
        mockGetValue.mockImplementation(() => false);
        renderHook(() => useWorkoutStepAudioSignal());

        act(() => { capturedHandlers['step-countdown']({ secondsRemaining: 4 }); });

        expect(mockPlayTone).not.toHaveBeenCalled();
    });

    it('plays the step-change tone on a step-changed event with stepChangeSignal:true, when the setting is on', () => {
        renderHook(() => useWorkoutStepAudioSignal());

        act(() => { capturedHandlers['step-changed']({ stepChangeSignal: true }); });

        expect(mockPlayTone).toHaveBeenCalledWith(STEP_CHANGE_TONE);
    });

    it('does not play the step-change tone when stepChangeSignal is false (departing step had no valid duration)', () => {
        renderHook(() => useWorkoutStepAudioSignal());

        act(() => { capturedHandlers['step-changed']({ stepChangeSignal: false }); });

        expect(mockPlayTone).not.toHaveBeenCalled();
    });

    it('does not play the step-change tone when the setting is off, even with stepChangeSignal:true', () => {
        mockGetValue.mockImplementation(() => false);
        renderHook(() => useWorkoutStepAudioSignal());

        act(() => { capturedHandlers['step-changed']({ stepChangeSignal: true }); });

        expect(mockPlayTone).not.toHaveBeenCalled();
    });

    it('ignores an undefined countdown/step-changed payload without throwing', () => {
        renderHook(() => useWorkoutStepAudioSignal());

        expect(() => {
            act(() => {
                capturedHandlers['step-countdown'](undefined);
                capturedHandlers['step-changed'](undefined);
            });
        }).not.toThrow();
        expect(mockPlayTone).not.toHaveBeenCalled();
    });

    it('does not throw and does not subscribe when the page observer is unavailable', () => {
        mockGetPageObserver.mockReturnValueOnce(undefined as any);
        expect(() => renderHook(() => useWorkoutStepAudioSignal())).not.toThrow();
        expect(mockOn).not.toHaveBeenCalled();
    });
});
