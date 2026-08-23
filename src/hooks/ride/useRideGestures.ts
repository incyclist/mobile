import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getRidePageService, useUserSettings, type PowerAdjustmentResult } from 'incyclist-services';
import { useLogging } from '../logging';
import { isVersionAtLeast } from '../../utils/version';

// Conditional import to prevent Storybook/web from crashing (same pattern as RouteItemView/WorkoutItemView)
let Gesture: any;
try {
    if (Platform.OS !== 'web') {
        ({ Gesture } = require('react-native-gesture-handler'));
    }
} catch {
    Gesture = undefined;
}

// Key a future settings screen should write to - not yet exposed in any UI.
export const WORKOUT_LOAD_INCREMENT_SETTING_KEY = 'preferences.workouts.loadIncrement';
export const DEFAULT_WORKOUT_LOAD_INCREMENT = 1;

// Left/right's "big adjustment" on a plain (no-workout) ride - matches web-ui's inc5/dec5 button
// magnitude exactly (component.jsx: onClick={()=>onInc(5)}), a flat constant independent of the
// user's own (small, up/down) loadIncrement setting. Any magnitude !== 1 already resolves to the
// "large" step in RidePageService.adjustLoad() (ERG: nominal 50W) and WorkoutRideService.gearChange()
// (gear: the raw magnitude itself, so 5 -> +-5 gears) - no services-layer change needed for this.
export const LARGE_LOAD_INCREMENT = 5;

// A swipe must clear a minimum distance OR speed to count - either is enough, so a slow-but-long
// drag and a fast-but-short flick both register (full-screen target, sweaty/shaky hands under load).
const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 300;

const FEEDBACK_DURATION_MS = 1200;
const VIBRATION_DURATION_MS = 40;

// The VIBRATE permission was only added to AndroidManifest.xml starting with app version 1.0.19.
// This bundle is a hot update served to every installed app regardless of native version, so an
// older Android install can still load it and crash calling Vibration.vibrate() without the
// permission. Gate on the actual installed native version (DeviceInfo.getVersion()), not
// getAppInfo()/app.json - that value is baked into this JS bundle and is identical for every
// device that loads it, so it can't tell old installs apart from new ones.
const MIN_ANDROID_VIBRATION_VERSION = '1.0.19';

const canVibrate = (): boolean => {
    if (Platform.OS !== 'android') {
        return true;
    }
    return isVersionAtLeast(DeviceInfo.getVersion(), MIN_ANDROID_VIBRATION_VERSION);
};

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export const classifySwipe = (
    translationX: number,
    translationY: number,
    velocityX: number,
    velocityY: number
): SwipeDirection | null => {
    const absX = Math.abs(translationX);
    const absY = Math.abs(translationY);
    const isHorizontal = absX > absY;

    const distance = isHorizontal ? absX : absY;
    const velocity = isHorizontal ? Math.abs(velocityX) : Math.abs(velocityY);

    if (distance < SWIPE_DISTANCE_THRESHOLD && velocity < SWIPE_VELOCITY_THRESHOLD) {
        return null;
    }

    if (isHorizontal) {
        return translationX > 0 ? 'right' : 'left';
    }
    return translationY > 0 ? 'down' : 'up';
};

// Appends the adjusted quantity to the swipe feedback. adjustLoad() reports two distinct cases
// (WorkoutRideService.powerUp()/powerDown()): a step that allows a power range (e.g. 120-170W)
// has its targetPower nudged directly - "+5% (155W)"; otherwise the Workout FTP itself was scaled -
// "+5% (FTP: 220W)", labelled so it isn't mistaken for the current step's target. Omitted entirely
// when unavailable (e.g. no FTP configured and the current step isn't a power range).
export const formatPowerAdjustment = (result: PowerAdjustmentResult | undefined): string => {
    if (!result || Number.isNaN(result.value)) {
        return '';
    }
    const watts = Math.round(result.value);
    return result.type === 'ftp' ? ` (FTP: ${watts}W)` : ` (${watts}W)`;
};

// The nominal Watt step a plain (no-workout) ERG-mode swipe actually applies
// (RidePageService.adjustLoad() -> RideDisplayService.adjustDevicePower()) - mirrors
// WorkoutRideService.getPowerRangeDeltaVal()'s convention, kept in sync manually since it isn't
// exported. Also used by gestureHintContent.ts (src/pages/RidePage/) for the hint overlay's legend.
const nominalErgWatts = (increment: number) => (increment === 1 ? 5 : 50);

// FIXES_BACKLOG #37: in SIM/Resistance mode with virtual shifting enabled, adjustLoad() performs a
// gear shift instead of a power/FTP nudge (WorkoutRideService.powerUp()/powerDown(), gear mode) -
// the swipe feedback must say so, not claim a "%" power adjustment that didn't happen. `increment`
// is always the raw magnitude actually applied (== the gearDelta WorkoutRideService.gearChange()
// was called with), so it doubles as the gear-step count here.
//
// A plain (no-workout) ERG-mode adjustment also reports `{type:'targetPower'}` - same as a
// workout's in-range nudge - but with `value: NaN` (RideDisplayService.adjustDevicePower() can't
// know the resulting absolute Watts, only the delta it sent). That NaN is the signal to label it
// with the nominal Watt step actually applied instead of `increment` as "%", which is meaningless
// outside a workout (there is no FTP/range for it to be a percentage of).
export const formatSwipeFeedback = (sign: '+' | '-', increment: number, result: PowerAdjustmentResult | undefined): string => {
    if (result?.type === 'gear') {
        return `${sign}${increment} gear`;
    }
    if (result?.type === 'targetPower' && Number.isNaN(result.value)) {
        return `${sign}${nominalErgWatts(increment)}W`;
    }
    return `${sign}${increment}%${formatPowerAdjustment(result)}`;
};

export interface RideGestureFeedback {
    visible: boolean;
    message: string;
}

export interface UseRideGesturesResult {
    /** Pass to <GestureDetector gesture={gesture}>; undefined on web/Storybook, where GestureDetector must not be rendered. */
    gesture: any;
    feedback: RideGestureFeedback;
    /** Current `preferences.workouts.loadIncrement` setting (%) — read live, never hardcoded.
     * Exposed so callers (e.g. the StartRideDisplay gesture legend) can show the real value
     * without duplicating the useUserSettings() lookup this hook already does for swipe-up/down. */
    loadIncrement: number;
}

// Single factory (FIXES_BACKLOG #24) - getRidePageService() is a single ride-type-agnostic
// RidePageService for Workout/GPX/Video rides alike (no per-ride-type subclass), so this hook
// works unchanged wherever it's wired: the dedicated Workout ride, or a plain/combo GPX or Video
// ride - adjustLoad()/onStepBack()/onStepForward() already branch internally on workout/cycling-mode
// state (see RidePageService.adjustLoad(), §4.4.5) rather than relying on which screen called them.
export const useRideGestures = (): UseRideGesturesResult => {
    const { logEvent, logError } = useLogging('RideGestures');
    const userSettings = useUserSettings();
    const service = getRidePageService();

    const [feedback, setFeedback] = useState<RideGestureFeedback>({ visible: false, message: '' });
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showFeedback = useCallback((message: string) => {
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        setFeedback({ visible: true, message });
        feedbackTimeoutRef.current = setTimeout(() => {
            setFeedback({ visible: false, message: '' });
            feedbackTimeoutRef.current = null;
        }, FEEDBACK_DURATION_MS);
    }, []);

    const getLoadIncrement = useCallback((): number => {
        return Number(userSettings.getValue(WORKOUT_LOAD_INCREMENT_SETTING_KEY, DEFAULT_WORKOUT_LOAD_INCREMENT));
    }, [userSettings]);

    const handleSwipe = useCallback((direction: SwipeDirection) => {
        // FIXES_BACKLOG #37: in SIM/Resistance mode with virtual shifting disabled there is no
        // gear concept and no power target to nudge, so a load-adjust swipe would be a silent
        // no-op. Disable the gesture outright in that case (rather than a "no effect" toast, which
        // has no existing precedent here) - avoids training the rider that swiping up/down does
        // something in this mode. Step back/forward (left/right) are unaffected - re-check fresh on
        // every swipe, since the rider can toggle ERG/SIM mid-ride.
        if ((direction === 'up' || direction === 'down') && service.getLoadButtonMode() === 'hidden') {
            logEvent({ message: 'gesture ignored', gesture: `swipe-${direction}`, reason: 'loadButtonMode=hidden', eventSource: 'user' });
            return;
        }

        // Without a workout attached, left/right instead performs a "big" load adjustment (below) -
        // same as up/down, that has nothing to do in loadButtonMode==='hidden' (no gear concept, no
        // power target), so it's disabled outright rather than showing a misleading toast.
        if ((direction === 'left' || direction === 'right') && !service.isWorkoutAttached() && service.getLoadButtonMode() === 'hidden') {
            logEvent({ message: 'gesture ignored', gesture: `swipe-${direction}`, reason: 'no workout attached, loadButtonMode=hidden', eventSource: 'user' });
            return;
        }

        // Vibration.vibrate() can throw natively (missing permission, no vibrator motor on this
        // device) - that must never take down an in-progress ride over haptic feedback.
        if (canVibrate()) {
            try {
                Vibration.vibrate(VIBRATION_DURATION_MS);
            }
            catch (err) {
                logError(err as Error, 'handleSwipe - vibrate');
            }
        }

        switch (direction) {
            case 'left':
            case 'right': {
                if (service.isWorkoutAttached()) {
                    if (direction === 'left') {
                        logEvent({ message: 'gesture triggered', gesture: 'swipe-left', action: 'step-back', eventSource: 'user' });
                        service.onStepBack();
                        showFeedback('◀ Step Back');
                    }
                    else {
                        logEvent({ message: 'gesture triggered', gesture: 'swipe-right', action: 'step-forward', eventSource: 'user' });
                        service.onStepForward();
                        showFeedback('Step Forward ▶');
                    }
                }
                else {
                    // No workout attached: left/right is the "big" load adjustment instead - up/down
                    // stays the fine one (the user's own loadIncrement setting), left/right is always
                    // the flat LARGE_LOAD_INCREMENT (matches web-ui's inc5/dec5 buttons), giving a
                    // bigger-jump option without adding a whole separate large-swipe gesture.
                    const increase = direction === 'right';
                    logEvent({
                        message: 'gesture triggered', gesture: `swipe-${direction}`,
                        action: increase ? 'increase-load-large' : 'decrease-load-large',
                        increment: LARGE_LOAD_INCREMENT, eventSource: 'user'
                    });
                    const result = service.adjustLoad(increase ? LARGE_LOAD_INCREMENT : -LARGE_LOAD_INCREMENT);
                    showFeedback(formatSwipeFeedback(increase ? '+' : '-', LARGE_LOAD_INCREMENT, result));
                }
                break;
            }
            case 'up': {
                const increment = getLoadIncrement();
                logEvent({ message: 'gesture triggered', gesture: 'swipe-up', action: 'increase-load', increment, eventSource: 'user' });
                const result = service.adjustLoad(increment);
                showFeedback(formatSwipeFeedback('+', increment, result));
                break;
            }
            case 'down': {
                const increment = getLoadIncrement();
                logEvent({ message: 'gesture triggered', gesture: 'swipe-down', action: 'decrease-load', increment, eventSource: 'user' });
                const result = service.adjustLoad(-increment);
                showFeedback(formatSwipeFeedback('-', increment, result));
                break;
            }
        }
    }, [logEvent, logError, service, getLoadIncrement, showFeedback]);

    const gesture = useMemo(() => {
        if (!Gesture) {
            return undefined;
        }

        return Gesture.Pan()
            .minDistance(10)
            .onEnd((e: { translationX: number; translationY: number; velocityX: number; velocityY: number }) => {
                const direction = classifySwipe(e.translationX, e.translationY, e.velocityX, e.velocityY);
                if (direction) {
                    handleSwipe(direction);
                }
            });
    }, [handleSwipe]);

    return { gesture, feedback, loadIncrement: getLoadIncrement() };
};
