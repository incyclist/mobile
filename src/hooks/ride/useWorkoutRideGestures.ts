import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import { getWorkoutRidePageService, useUserSettings } from 'incyclist-services';
import { useLogging } from '../logging';

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

// A swipe must clear a minimum distance OR speed to count - either is enough, so a slow-but-long
// drag and a fast-but-short flick both register (full-screen target, sweaty/shaky hands under load).
const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 300;

const FEEDBACK_DURATION_MS = 1200;
const VIBRATION_DURATION_MS = 40;

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

export interface WorkoutRideGestureFeedback {
    visible: boolean;
    message: string;
}

export interface UseWorkoutRideGesturesResult {
    /** Pass to <GestureDetector gesture={gesture}>; undefined on web/Storybook, where GestureDetector must not be rendered. */
    gesture: any;
    feedback: WorkoutRideGestureFeedback;
}

export const useWorkoutRideGestures = (): UseWorkoutRideGesturesResult => {
    const { logEvent } = useLogging('WorkoutRideGestures');
    const userSettings = useUserSettings();
    const service = getWorkoutRidePageService();

    const [feedback, setFeedback] = useState<WorkoutRideGestureFeedback>({ visible: false, message: '' });
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
        Vibration.vibrate(VIBRATION_DURATION_MS);

        switch (direction) {
            case 'left':
                logEvent({ message: 'gesture triggered', gesture: 'swipe-left', action: 'step-back', eventSource: 'user' });
                service.onStepBack();
                showFeedback('◀ Step Back');
                break;
            case 'right':
                logEvent({ message: 'gesture triggered', gesture: 'swipe-right', action: 'step-forward', eventSource: 'user' });
                service.onStepForward();
                showFeedback('Step Forward ▶');
                break;
            case 'up': {
                const increment = getLoadIncrement();
                logEvent({ message: 'gesture triggered', gesture: 'swipe-up', action: 'increase-load', increment, eventSource: 'user' });
                service.adjustLoad(increment);
                showFeedback(`+${increment}%`);
                break;
            }
            case 'down': {
                const increment = getLoadIncrement();
                logEvent({ message: 'gesture triggered', gesture: 'swipe-down', action: 'decrease-load', increment, eventSource: 'user' });
                service.adjustLoad(-increment);
                showFeedback(`-${increment}%`);
                break;
            }
        }
    }, [logEvent, service, getLoadIncrement, showFeedback]);

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

    return { gesture, feedback };
};
