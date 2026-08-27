// Jest mock for react-native-audio-api's system/index (AudioManager singleton), deep-imported
// directly by src/utils/stepChangeAudio.ts - see the comment there and in
// react-native-audio-api-core-AudioContext.ts for why the deep import exists.

export default {
    setAudioSessionOptions: jest.fn(),
    setAudioSessionActivity: jest.fn().mockResolvedValue(undefined),
};
