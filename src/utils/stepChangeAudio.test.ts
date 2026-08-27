const mockSetValueAtTime = jest.fn();
const mockLinearRampToValueAtTime = jest.fn();
const mockConnect = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockResume = jest.fn().mockResolvedValue(undefined);
const mockSetAudioSessionOptions = jest.fn();
const mockSetAudioSessionActivity = jest.fn().mockResolvedValue(undefined);

let mockAudioContextImpl: jest.Mock;

jest.mock('react-native-audio-api/src/core/AudioContext', () => ({
    __esModule: true,
    get default() {
        return mockAudioContextImpl;
    },
}));

jest.mock('react-native-audio-api/src/system', () => ({
    __esModule: true,
    default: {
        setAudioSessionOptions: (...args: unknown[]) => mockSetAudioSessionOptions(...args),
        setAudioSessionActivity: (...args: unknown[]) => mockSetAudioSessionActivity(...args),
    },
}));

const makeOscillator = () => ({
    type: 'sine',
    frequency: { setValueAtTime: mockSetValueAtTime },
    connect: mockConnect,
    start: mockStart,
    stop: mockStop,
});

const makeGain = () => ({
    gain: { setValueAtTime: mockSetValueAtTime, linearRampToValueAtTime: mockLinearRampToValueAtTime },
    connect: mockConnect,
});

describe('stepChangeAudio', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        mockAudioContextImpl = jest.fn().mockImplementation(function (this: any) {
            this.currentTime = 10;
            this.state = 'running';
            this.destination = {};
            this.createOscillator = jest.fn(makeOscillator);
            this.createGain = jest.fn(makeGain);
            this.resume = mockResume;
        });
    });

    it('exposes the tone constants, numerically identical to web-ui\'s contract', () => {
        const { STEP_COUNTDOWN_TICK_TONE, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        expect(STEP_COUNTDOWN_TICK_TONE).toEqual({ frequencyHz: 440, durationMs: 100, waveform: 'sine' });
        expect(STEP_CHANGE_TONE).toEqual({ frequencyHz: 660, durationMs: 250, waveform: 'sine' });
    });

    it('reports audio available once AudioContext can be constructed', () => {
        const { isStepAudioAvailable } = require('./stepChangeAudio');
        expect(isStepAudioAvailable()).toBe(true);
    });

    it('probes AudioContext only once across multiple calls (cached after first probe)', () => {
        const { isStepAudioAvailable, playTone, STEP_COUNTDOWN_TICK_TONE } = require('./stepChangeAudio');
        isStepAudioAvailable();
        playTone(STEP_COUNTDOWN_TICK_TONE);
        playTone(STEP_COUNTDOWN_TICK_TONE);
        expect(mockAudioContextImpl).toHaveBeenCalledTimes(1);
    });

    it('configures the iOS audio session (playback category, mixWithOthers) once the context is created', () => {
        const { isStepAudioAvailable } = require('./stepChangeAudio');
        isStepAudioAvailable();
        expect(mockSetAudioSessionOptions).toHaveBeenCalledWith({
            iosCategory: 'playback',
            iosOptions: ['mixWithOthers'],
        });
    });

    // Regression: setAudioSessionOptions() only configures the category - it does not activate
    // the session. Without also calling setAudioSessionActivity(true), the session never actually
    // engages and no audio reaches the speaker even though the oscillator graph runs without error.
    it('activates the audio session (setAudioSessionActivity(true)) once the context is created', () => {
        const { isStepAudioAvailable } = require('./stepChangeAudio');
        isStepAudioAvailable();
        expect(mockSetAudioSessionActivity).toHaveBeenCalledWith(true);
    });

    // Regression: a freshly-constructed AudioContext can come up 'suspended' (e.g. created outside
    // a direct user-gesture call stack) - resume() must be attempted or tones silently never play.
    it('resumes the context when it is not already running', () => {
        mockAudioContextImpl = jest.fn().mockImplementation(function (this: any) {
            this.currentTime = 10;
            this.state = 'suspended';
            this.destination = {};
            this.createOscillator = jest.fn(makeOscillator);
            this.createGain = jest.fn(makeGain);
            this.resume = mockResume;
        });

        const { isStepAudioAvailable } = require('./stepChangeAudio');
        isStepAudioAvailable();
        expect(mockResume).toHaveBeenCalled();
    });

    it('does not call resume() again once the context is already running', () => {
        const { isStepAudioAvailable, playTone, STEP_COUNTDOWN_TICK_TONE } = require('./stepChangeAudio');
        isStepAudioAvailable();
        playTone(STEP_COUNTDOWN_TICK_TONE);
        expect(mockResume).not.toHaveBeenCalled();
    });

    it('builds an oscillator/gain graph matching the tone spec and starts/stops it', () => {
        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        playTone(STEP_CHANGE_TONE);

        expect(mockSetValueAtTime).toHaveBeenCalledWith(660, 10); // oscillator.frequency at currentTime
        expect(mockStart).toHaveBeenCalledWith(10);
        expect(mockStop).toHaveBeenCalledWith(10.25); // currentTime + 250ms
        expect(mockConnect).toHaveBeenCalledTimes(2); // oscillator->gain, gain->destination
        expect(mockLinearRampToValueAtTime).toHaveBeenCalledWith(0, 10.25); // ramp-down to avoid a click
    });

    // Regression / core contract of the "app-aware" design: the JS bundle carrying this code ships
    // via hot-update ahead of the app-store release that adds the native module, so a device on an
    // older binary must degrade silently, not crash.
    it('degrades silently when AudioContext throws (native module not linked on this binary)', () => {
        mockAudioContextImpl = jest.fn().mockImplementation(() => {
            throw new Error('Native module RNAudioAPIModule not found');
        });

        const { isStepAudioAvailable, playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');

        expect(isStepAudioAvailable()).toBe(false);
        expect(() => playTone(STEP_CHANGE_TONE)).not.toThrow();
        expect(mockStart).not.toHaveBeenCalled();
    });

    it('never throws even if building/starting the oscillator graph itself fails', () => {
        mockStart.mockImplementation(() => {
            throw new Error('boom');
        });
        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');

        expect(() => playTone(STEP_CHANGE_TONE)).not.toThrow();
    });
});
