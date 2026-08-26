// Jest mock for react-native-audio-api - the native module has no JS-testable implementation
// under Jest (it wraps native oscillator/session APIs), so any test that imports code depending on
// it (directly or transitively, e.g. via src/utils/stepChangeAudio.ts) needs this in place instead
// of the real package. Mirrors the (small) subset of the Web-Audio-API-shaped surface that
// stepChangeAudio.ts actually uses. Tests that need to control specific behaviour (e.g. a
// constructor that throws, to simulate a binary without the native module linked) override this
// with a local jest.mock('react-native-audio-api', ...) in that test file.

class MockAudioParam {
    value = 0;
    setValueAtTime = jest.fn().mockReturnThis();
    linearRampToValueAtTime = jest.fn().mockReturnThis();
    exponentialRampToValueAtTime = jest.fn().mockReturnThis();
    setTargetAtTime = jest.fn().mockReturnThis();
    cancelScheduledValues = jest.fn().mockReturnThis();
}

class MockAudioNode {
    connect = jest.fn();
    disconnect = jest.fn();
}

class MockOscillatorNode extends MockAudioNode {
    type = 'sine';
    frequency = new MockAudioParam();
    detune = new MockAudioParam();
    start = jest.fn();
    stop = jest.fn();
}

class MockGainNode extends MockAudioNode {
    gain = new MockAudioParam();
}

export class AudioContext {
    currentTime = 0;
    destination = new MockAudioNode();
    createOscillator = jest.fn(() => new MockOscillatorNode());
    createGain = jest.fn(() => new MockGainNode());
}

export const AudioManager = {
    setAudioSessionOptions: jest.fn(),
};

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
