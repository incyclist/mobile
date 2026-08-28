const mockPlay = jest.fn();
let mockAudioCueDefault: { play: jest.Mock } | null;

jest.mock('../specs/NativeAudioCue', () => ({
    __esModule: true,
    get default() {
        return mockAudioCueDefault;
    },
}));

describe('stepChangeAudio', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        mockAudioCueDefault = { play: mockPlay };
    });

    it('exposes the tone constants, numerically identical to web-ui\'s contract', () => {
        const { STEP_COUNTDOWN_TICK_TONE, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        expect(STEP_COUNTDOWN_TICK_TONE).toEqual({ frequencyHz: 440, durationMs: 100, waveform: 'sine' });
        expect(STEP_CHANGE_TONE).toEqual({ frequencyHz: 660, durationMs: 250, waveform: 'sine' });
    });

    it('plays a tone by calling AudioCue.play(frequencyHz, durationMs)', () => {
        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');
        playTone(STEP_CHANGE_TONE);

        expect(mockPlay).toHaveBeenCalledWith(660, 250);
    });

    it('plays the countdown tick tone with its own frequency/duration', () => {
        const { playTone, STEP_COUNTDOWN_TICK_TONE } = require('./stepChangeAudio');
        playTone(STEP_COUNTDOWN_TICK_TONE);

        expect(mockPlay).toHaveBeenCalledWith(440, 100);
    });

    // Regression / core contract of the "app-aware" design: the JS bundle carrying this code ships
    // via hot-update ahead of the app-store release that adds the native module, so a device on an
    // older binary must degrade silently, not crash.
    it('degrades silently when AudioCue is null (native module not linked on this binary)', () => {
        mockAudioCueDefault = null;

        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');

        expect(() => playTone(STEP_CHANGE_TONE)).not.toThrow();
        expect(mockPlay).not.toHaveBeenCalled();
    });

    it('never throws even if the native play() call itself throws', () => {
        mockPlay.mockImplementation(() => {
            throw new Error('boom');
        });
        const { playTone, STEP_CHANGE_TONE } = require('./stepChangeAudio');

        expect(() => playTone(STEP_CHANGE_TONE)).not.toThrow();
    });
});
