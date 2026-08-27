// Deep-imported from the package's own source files rather than its root ('react-native-audio-api')
// or 'react-native-audio-api/src' index: those barrels re-export AudioControls (an optional UI
// component), which unconditionally imports react-native-reanimated - a dependency this app
// doesn't have and doesn't need for tone playback. Metro resolves every module reachable from an
// import regardless of which named export is actually used, so pulling in the barrel fails the
// bundle even though AudioControls itself is never referenced. AudioContext/AudioManager's own
// import chains (verified directly) don't touch AudioControls/reanimated at all.
//
// Loaded via require(), not `import`/`import type`: the package's package.json only maps the root
// specifier to a compiled .d.ts, not these deep subpaths, so an `import` here makes `tsc` fall back
// to compiling the package's raw .ts SOURCE directly - which transitively pulls in its entire
// internal module graph and fails, since that source assumes TypeScript's DOM lib (OscillatorType,
// BiquadFilterType, PeriodicWaveConstraints, BaseAudioContext, globalThis index signatures, etc.)
// this project's tsconfig doesn't include, plus a missing @types/semver for one of its own internal
// imports (confirmed via CI: node_modules/react-native-audio-api/src/**, dozens of TS7017/TS2304
// errors). None of that is fixable from here - it's the published package's own type-checking
// assumptions, not a bug in our code, and adding the "dom" lib project-wide to accommodate it both
// left the globalThis errors unfixed AND introduced a real new type conflict elsewhere (this
// project's own VideoMediaError colliding with DOM's global MediaError). A plain require() call is
// untyped (`any`) as far as `tsc` is concerned, so it never opens/checks the target file at all -
// this only affects the type-CHECK pass; Metro/Jest still resolve and run the real runtime code
// exactly as they did with the previous `import` syntax (Babel compiles both to the same
// require()+interop-default access either way).

interface AudioParamLike {
    setValueAtTime(value: number, startTime: number): AudioParamLike;
    linearRampToValueAtTime(value: number, endTime: number): AudioParamLike;
}

interface AudioNodeLike {
    connect(destination: AudioNodeLike): void;
}

interface OscillatorNodeLike extends AudioNodeLike {
    type: string;
    frequency: AudioParamLike;
    start(when?: number): void;
    stop(when?: number): void;
}

interface GainNodeLike extends AudioNodeLike {
    gain: AudioParamLike;
}

interface AudioContextLike {
    readonly currentTime: number;
    readonly state: string;
    readonly destination: AudioNodeLike;
    resume(): Promise<void>;
    createOscillator(): OscillatorNodeLike;
    createGain(): GainNodeLike;
}

interface AudioManagerLike {
    setAudioSessionOptions(options: { iosCategory?: string; iosOptions?: string[] }): void;
    setAudioSessionActivity(enabled: boolean): Promise<void>;
}

const AudioContextCtor: new () => AudioContextLike = require('react-native-audio-api/src/core/AudioContext').default;
const AudioManager: AudioManagerLike = require('react-native-audio-api/src/system').default;

/**
 * "App-aware" tone playback for the Workout Step Change Audio Signal feature (see the feature's
 * design doc, mobile section). This module MUST degrade silently on an app binary that doesn't
 * have `react-native-audio-api`'s native module linked yet: the JS bundle carrying this code ships
 * via hot-update ahead of the app-store release that adds the native dependency, so any device on
 * an older binary will still load and execute this file. `new AudioContextCtor()` throws in that
 * case (missing native module) - caught once here and cached, so every later call is a cheap no-op
 * rather than a repeated throw/catch.
 */

export interface ToneSpec {
    frequencyHz: number;
    durationMs: number;
    waveform: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
}

// Kept numerically identical to web-ui's stepChangeTone.js constants (cross-platform contract,
// see the feature's design doc).
export const STEP_COUNTDOWN_TICK_TONE: ToneSpec = { frequencyHz: 440, durationMs: 100, waveform: 'sine' };
export const STEP_CHANGE_TONE: ToneSpec = { frequencyHz: 660, durationMs: 250, waveform: 'sine' };

// Gain ramp-down before oscillator.stop() to avoid an audible click at the tone's end.
const GAIN_RAMP_MS = 5;

let audioContext: AudioContextLike | null | undefined; // undefined = not yet probed

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

const getAudioContext = (): AudioContextLike | null => {
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
        audioContext = new AudioContextCtor();
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
