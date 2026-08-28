import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    /**
     * Synthesizes and plays a short sine tone at the given frequency/duration - no bundled audio
     * files, no asset pipeline, nothing read from disk. Fire-and-forget - never returns a value or
     * throws across the bridge; a synthesis/playback failure is a silent no-op on the native side
     * so it never blocks an in-progress ride.
     *
     * Implemented via AVAudioEngine/AVAudioPlayerNode (iOS) / AudioTrack (Android), generating the
     * waveform directly into a PCM buffer - deliberately does not touch AVAudioSession's
     * record-permission surface, so no microphone usage-description entry is required.
     */
    play(frequencyHz: number, durationMs: number): void;
}

// get(), not getEnforcing(): getEnforcing() throws if the module isn't registered, which would
// crash app startup on any device still running a binary older than the one that links AudioCue -
// this JS bundle can reach such devices via hot-update ahead of that native release. get() returns
// null instead, matching the rest of this feature's "degrade silently on an older binary" design
// (see stepChangeAudio.ts).
const AudioCue: Spec | null =
    Platform.OS === 'android' || Platform.OS === 'ios'
        ? TurboModuleRegistry.get<Spec>('AudioCue')
        : null;

export default AudioCue;
