/**
 * Pure helpers driving `CurrentRow`'s visual pulse (Workout Step Change Audio Signal feature, mobile
 * section). Computed locally from `step.remaining`/`step.duration` - already passed as props every
 * render - rather than threaded down as a new prop from the services-layer countdown event, so
 * `WorkoutStepsList` keeps its documented "pure view, no service access" boundary. As a result the
 * visual pulse and the audio tone (`useWorkoutStepAudioSignal`, driven by the actual
 * 'step-countdown'/'step-changed' events) are two independently-computed renderings of the same
 * underlying condition - they may drift by a render tick, which is imperceptible in practice.
 */

/**
 * Which of the last-4-seconds countdown buckets (4, 3, 2, 1) `remaining` currently falls in, or
 * `null` outside that window (including a step with no known duration, or already at/past zero).
 */
export const getCountdownBucket = (remaining: number | null, duration: number): number | null => {
    if (remaining === null || duration <= 0 || remaining <= 0 || remaining > 4) {
        return null;
    }
    return Math.ceil(remaining);
};

/**
 * True the instant `remaining` jumps back up relative to the previous tick - i.e. a new step just
 * started. The +0.5 guard absorbs float jitter across a ~500ms update tick (a step naturally
 * counting down should never appear to increase by more than that between two consecutive ticks).
 */
export const hasStepJustStarted = (remaining: number | null, prevRemaining: number | null): boolean => {
    if (remaining === null || prevRemaining === null) {
        return false;
    }
    return remaining > prevRemaining + 0.5;
};
