import AudioCue from '../specs/NativeAudioCue';

/**
 * "App-aware" tone playback for the Workout Step Change Audio Signal feature (see the feature's
 * design doc, mobile section). Tones are synthesized natively (AudioCue TurboModule,
 * src/specs/NativeAudioCue.ts) from a plain (frequencyHz, durationMs) call - no bundled audio
 * files, no asset pipeline, nothing read from disk on either platform.
 *
 * This must degrade silently on an app binary that doesn't have the AudioCue native module linked
 * yet: the JS bundle carrying this code ships via hot-update ahead of the app-store release that
 * adds the native module, so any device on an older binary will still load and execute this file.
 * `AudioCue` is `null` in that case (see NativeAudioCue.ts) - every call below no-ops.
 */

export interface ToneSpec {
    frequencyHz: number;
    durationMs: number;
    waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
}

// Kept numerically identical to web-ui's stepChangeTone.js constants (cross-platform contract,
// see the feature's design doc). `waveform` is part of that shared contract but currently unused
// here - AudioCue only synthesizes a sine wave; both tones happen to specify 'sine' already.
export const STEP_COUNTDOWN_TICK_TONE: ToneSpec = { frequencyHz: 440, durationMs: 100, waveform: 'sine' };
export const STEP_CHANGE_TONE: ToneSpec = { frequencyHz: 660, durationMs: 250, waveform: 'sine' };

export const playTone = (spec: ToneSpec): void => {
    const cue = AudioCue;
    if (!cue) {
        return; // no-op on binaries without the native module - never throws
    }

    try {
        cue.play(spec.frequencyHz, spec.durationMs);
    } catch {
        // never let a tone-playback failure take down an in-progress ride
    }
};
