import { AudioContext, AudioManager, OscillatorType } from 'react-native-audio-api';

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

// Garmin-watch-matched spec - kept numerically identical to web-ui's stepChangeTone.js constants
// (cross-platform contract, see the feature's design doc).
export const STEP_COUNTDOWN_TICK_TONE: ToneSpec = { frequencyHz: 2731, durationMs: 100, waveform: 'sine' };
export const STEP_CHANGE_TONE: ToneSpec = { frequencyHz: 4096, durationMs: 250, waveform: 'sine' };

// Gain ramp-down before oscillator.stop() to avoid an audible click at the tone's end.
const GAIN_RAMP_MS = 5;

let audioContext: AudioContext | null | undefined; // undefined = not yet probed

// Configures the iOS audio session so tones mix with whatever media/music is already playing
// instead of being silenced by the mute switch (iosCategory 'playback' ignores the mute switch;
// 'mixWithOthers' keeps any underlying music playing rather than stopping it). No-op on Android.
// Best-effort - a failure here must never block tone playback.
const configureAudioSession = (): void => {
    try {
        AudioManager.setAudioSessionOptions({
            iosCategory: 'playback',
            iosOptions: ['mixWithOthers'],
        });
    }
    catch {
        // ignore - tones still play, just without the preferred session configuration
    }
};

const getAudioContext = (): AudioContext | null => {
    if (audioContext !== undefined) {
        return audioContext;
    }
    try {
        audioContext = new AudioContext();
        configureAudioSession();
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
