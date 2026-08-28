import { useCallback, useEffect, useRef } from 'react';
import { getRidePageService, useUserSettings, type IObserver, type StepCountdownTick } from 'incyclist-services';
import { useUnmountEffect } from '../unmount';
import { playTone, STEP_COUNTDOWN_TICK_TONE, STEP_CHANGE_TONE } from '../../utils/stepChangeAudio';
import { Platform } from 'react-native';
import { isVersionAtLeast } from '../../utils/version';
import DeviceInfo from 'react-native-device-info';

// Shared with the settings UI (WorkoutDetailsDialog, WorkoutSettingsDialog) - read/written directly
// via useUserSettings(), not proxied through a page-service display-prop, same direct pattern
// useRideGestures.ts already uses for its own preferences.workouts.* key. Defaults to true: the
// audio cue is opt-out, not opt-in.
export const STEP_CHANGE_AUDIO_SIGNAL_SETTING_KEY = 'preferences.workouts.stepChangeAudioSignal';
export const DEFAULT_STEP_CHANGE_AUDIO_SIGNAL = true;
export const MIN_ANDROID_PLAY_AUDIO_VERSION = '1.2.0'

export const canPlayAudio = (): boolean => {
    if (Platform.OS !== 'android') {
        return true;
    }
    return isVersionAtLeast( DeviceInfo.getVersion() , MIN_ANDROID_PLAY_AUDIO_VERSION);
};

/**
 * Side-effect-only hook (no return value) that plays the Garmin-watch-style countdown
 * ticks/step-change tone for a workout ride, mirroring `useRideGestures.ts`'s shape:
 * `getRidePageService()` + `useUserSettings()`. Subscription lifecycle follows the same
 * ref-guarded-subscribe / `useUnmountEffect`-cleanup convention as `useRidePageLifecycle.ts` and
 * `WorkoutSettingsDialog.tsx` - subscribe exactly once (a plain `useEffect` cleanup would also fire
 * on every dependency-array identity change, which `useUnmountEffect` deliberately avoids).
 *
 * `playTone()` (src/utils/stepChangeAudio.ts) is itself "app-aware" - it no-ops silently on a
 * binary that doesn't have the `AudioCue` native module linked yet, so this hook never needs to
 * check availability itself; it just always calls through when the user's setting is on, and
 * audio activates itself automatically once the device's binary supports it.
 *
 * 'step-countdown' is a pure passthrough on the page observer
 * (RidePageService.onWorkoutStepCountdown()) - deliberately not routed through the page's
 * 'page-update' rebuild, so this hook subscribes to it directly rather than reading anything from
 * `getPageDisplayProps()`. It carries the ENTIRE signal now, including the step-change instant
 * itself (`secondsRemaining:0`) - precisely scheduled by WorkoutRide via wall-clock timers rather
 * than detected on its poll loop, so it isn't subject to that loop's jitter (previously the
 * transition tone was driven by 'step-changed', which - being tied to the poll loop - could be
 * audibly delayed under load; this hook no longer listens to 'step-changed' at all).
 */
export const useWorkoutStepAudioSignal = (): void => {
    const userSettings = useUserSettings();
    const service = getRidePageService();

    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const isEnabled = useCallback(
        () => Boolean(userSettings.getValue(STEP_CHANGE_AUDIO_SIGNAL_SETTING_KEY, DEFAULT_STEP_CHANGE_AUDIO_SIGNAL)),
        [userSettings]
    );

    const onCountdown = useCallback((tick?: StepCountdownTick) => {
        if (!tick || !isEnabled()) {
            return;
        }
        if (canPlayAudio())        
            playTone(tick.secondsRemaining === 0 ? STEP_CHANGE_TONE : STEP_COUNTDOWN_TICK_TONE);
    }, [isEnabled]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        const observer = service.getPageObserver();
        refObserver.current = observer;
        observer?.on('step-countdown', onCountdown);
    }, [service, onCountdown]);

    useUnmountEffect(() => {
        refObserver.current?.off('step-countdown', onCountdown);
        refInitialized.current = false;
    });
};
