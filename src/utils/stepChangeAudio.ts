// Deep-imported from the package's own source files rather than its root ('react-native-audio-api')
// or 'react-native-audio-api/src' index: those barrels re-export AudioControls (an optional UI
// component), which unconditionally imports react-native-reanimated - a dependency this app
// doesn't have and doesn't need for tone playback. Metro resolves every module reachable from an
// import regardless of which named export is actually used, so pulling in the barrel fails the
// bundle even though AudioControls itself is never referenced. AudioContext/AudioManager's own
// import chains (verified directly) don't touch AudioControls/reanimated at all.
import AudioContext from 'react-native-audio-api/src/core/AudioContext';
import AudioManager from 'react-native-audio-api/src/system';
import type { OscillatorType } from 'react-native-audio-api/src/types';

/**
 * "App-aware" tone playback for the Workout Step Change Audio Signal feature (see the feature's
 * design doc, mobile section). This module MUST degrade silently on an app binary that doesn't
 * have `react-native-audio-api`'s native module linked yet: the JS bundle carrying this code ships
 * via hot-update ahead of the app-store release that adds the native dependency, so any device on
 * an older binary will still load and execute this file. `new AudioContext()` throws in that case
 * (missing native module) - caught once here and cached, so every later call is a cheap no-op
 * rather than a repeated throw/catch.
 */

export interface ToneSpec {
    frequencyHz: number;
    durationMs: number;
    waveform: OscillatorType;
}

// Kept numerically identical to web-ui's stepChangeTone.js constants (cross-platform contract,
// see the feature's design doc).
export const STEP_COUNTDOWN_TICK_TONE: ToneSpec = { frequencyHz: 440, durationMs: 100, waveform: 'sine' };
export const STEP_CHANGE_TONE: ToneSpec = { frequencyHz: 660, durationMs: 250, waveform: 'sine' };

// Gain ramp-down before oscillator.stop() to avoid an audible click at the tone's end.
const GAIN_RAMP_MS = 5;

let audioContext: AudioContext | null | undefined; // undefined = not yet probed

// Configures the iOS audio session so tones mix with whatever media/music is already playing
// instead of being silenced by the mute switch (iosCategory 'playback' ignores the mute switch;
// 'mixWithOthers' keeps any underlying music playing rather than stopping it). No-op on Android.
// Best-effort - a failure here must never block tone playback.
//
// setAudioSessionOptions() only configures the category/options - it does NOT activate the
// session (iOS's AVAudioSession has a separate "active" flag). Without also calling
// setAudioSessionActivity(true), the session is configured but never actually engaged, so no
// audio reaches the speaker even though oscillator.start()/stop() run without error. Fire-and-
// forget: it's async and there's normally several seconds of lead time before the first real tone
// (the countdown's first tick), plenty for it to complete in the background.
const configureAudioSession = (): void => {
    try {
        AudioManager.setAudioSessionOptions({
            iosCategory: 'playback',
            iosOptions: ['mixWithOthers'],
        });
        AudioManager.setAudioSessionActivity(true).catch(() => {
            // ignore - tones still get scheduled, just without a guaranteed-active session
        });
    }
    catch {
        // ignore - tones still play, just without the preferred session configuration
    }
};

const getAudioContext = (): AudioContext | null => {
    if (audioContext !== undefined) {
        // A freshly-constructed AudioContext can come up 'suspended' rather than 'running' -
        // resume() is idempotent/cheap once already running, so this is safe to call on every
        // probe rather than only at construction time.
        if (audioContext && audioContext.state !== 'running') {
            audioContext.resume().catch(() => {});
        }
        return audioContext;
    }
    try {
        audioContext = new AudioContext();
        configureAudioSession();
        if (audioContext.state !== 'running') {
            audioContext.resume().catch(() => {});
        }
    }
    catch {
        audioContext = null; // native module not linked on this binary - degrade silently
    }
    return audioContext;
};

/** True once a device's installed binary actually has the native module linked. Not used to gate
 *  any UI (the settings toggle is always shown/functional, per the feature's design) - exposed for
 *  callers that want to know whether audio is actually active on this device. */
export const isStepAudioAvailable = (): boolean => getAudioContext() !== null;

export const playTone = (spec: ToneSpec): void => {
    const ctx = getAudioContext();
    if (!ctx) {
        return; // no-op on binaries without the native module - never throws
    }

    try {
        const now = ctx.currentTime;
        const durationSec = spec.durationMs / 1000;
        const rampSec = Math.min(GAIN_RAMP_MS / 1000, durationSec / 2);

        const oscillator = ctx.createOscillator();
        oscillator.type = spec.waveform;
        oscillator.frequency.setValueAtTime(spec.frequencyHz, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(1, now);
        gain.gain.setValueAtTime(1, now + durationSec - rampSec);
        gain.gain.linearRampToValueAtTime(0, now + durationSec);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + durationSec);
    }
    catch {
        // never let a tone-playback failure take down an in-progress ride
    }
};
