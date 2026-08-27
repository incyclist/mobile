// Jest mock for react-native-audio-api's core/AudioContext (deep-imported directly by
// src/utils/stepChangeAudio.ts to avoid pulling in the package's AudioControls/reanimated
// dependency chain - see the comment in that file). Mirrors the small subset of the
// Web-Audio-API-shaped surface stepChangeAudio.ts actually uses. Tests that need to control
// specific behaviour (e.g. a constructor that throws, to simulate a binary without the native
// module linked) override this with a local jest.mock(...) in that test file.

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

export default class AudioContext {
    currentTime = 0;
    state = 'running';
    destination = new MockAudioNode();
    createOscillator = jest.fn(() => new MockOscillatorNode());
    createGain = jest.fn(() => new MockGainNode());
    resume = jest.fn().mockResolvedValue(undefined);
}
