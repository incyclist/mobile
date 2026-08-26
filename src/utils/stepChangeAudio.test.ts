const mockSetValueAtTime = jest.fn();
const mockLinearRampToValueAtTime = jest.fn();
const mockConnect = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockSetAudioSessionOptions = jest.fn();

let mockAudioContextImpl: jest.Mock;

jest.mock('react-native-audio-api', () => {
    return {
        get AudioContext() {
            return mockAudioContextImpl;
        },
        AudioManager: {
            setAudioSessionOptions: (...args: unknown[]) => mockSetAudioSessionOptions(...args),
        },
    };
});

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
            this.destination = {};
            this.createOscillator = jest.fn(makeOscillator);
            this.createGain = jest.fn(makeGain);
        });
    });

    it('exposes the Garmin-matched tone constants, numerically identical to web-ui\'s contract', () => {
        const { STEP_COUNTDOWN_TICK_TONE, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        expect(STEP_COUNTDOWN_TICK_TONE).toEqual({ frequencyHz: 2731, durationMs: 100, waveform: 'sine' });
        expect(STEP_CHANGE_TONE).toEqual({ frequencyHz: 4096, durationMs: 250, waveform: 'sine' });
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

    it('builds an oscillator/gain graph matching the tone spec and starts/stops it', () => {
        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        playTone(STEP_CHANGE_TONE);

        expect(mockSetValueAtTime).toHaveBeenCalledWith(4096, 10); // oscillator.frequency at currentTime
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
