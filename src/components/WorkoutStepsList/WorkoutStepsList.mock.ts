import type { WorkoutUpcomingSteps } from 'incyclist-services';

/**
 * `label` is the step's target description (`getStepTargetText` in `services`), e.g. "260W",
 * "260W at 100-120HR", "100-120 rpm", "Ramp 200-260W", "free" — NOT a step/segment title. The
 * segment title + rep count (e.g. "VO2 max (3/5)") lives only in the Dashboard shoutout's
 * composed text (RideDashboard's workoutShoutout), not per-row here.
 *
 * `previous`/`current`/`upcoming` are built from the FLATTENED, repeat-expanded step sequence —
 * a repeated segment shows up as one row per repetition, not one row for the whole segment.
 */

/** Mid-workout, inside a repeated VO2 block (2nd rep, "on" interval), power only. More reps follow. */
export const MOCK_STEPS_VO2: WorkoutUpcomingSteps = {
    previous: { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
    current: {
        label: '260W',
        targetPower: 260,
        duration: 180,
        remaining: 64,
        isCurrent: true,
    },
    upcoming: [
        { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
        { label: '260W', targetPower: 260, duration: 180, remaining: null, isCurrent: false },
        { label: '130W', targetPower: 130, duration: 120, remaining: null, isCurrent: false },
    ],
    hasMore: true,
};

/** A step combining a power target with a heartrate band, and a free (no-limit) upcoming step. */
export const MOCK_STEPS_MIXED_TARGETS: WorkoutUpcomingSteps = {
    previous: { label: 'Ramp 120-175W', targetPower: 148, duration: 300, remaining: null, isCurrent: false },
    current: {
        label: '260W at 100-120HR',
        targetPower: 260,
        duration: 300,
        remaining: 212,
        isCurrent: true,
    },
    upcoming: [
        { label: '160W', targetPower: 160, duration: 300, remaining: null, isCurrent: false },
        { label: 'free', targetPower: null, duration: 60, remaining: null, isCurrent: false },
    ],
    hasMore: false,
};

/** A cadence-only step (no power target) — also the very first step, so no previous. */
export const MOCK_STEPS_CADENCE_ONLY: WorkoutUpcomingSteps = {
    previous: null,
    current: {
        label: '100-120 rpm',
        targetPower: null,
        duration: 120,
        remaining: 45,
        isCurrent: true,
    },
    upcoming: [
        { label: '150W', targetPower: 150, duration: 180, remaining: null, isCurrent: false },
    ],
    hasMore: false,
};

/** A power ramp (progression) as the current step. */
export const MOCK_STEPS_RAMP: WorkoutUpcomingSteps = {
    previous: { label: '100W', targetPower: 100, duration: 60, remaining: null, isCurrent: false },
    current: {
        label: 'Ramp 120-175W',
        targetPower: 148,
        duration: 300,
        remaining: 212,
        isCurrent: true,
    },
    upcoming: [
        { label: '160W', targetPower: 160, duration: 300, remaining: null, isCurrent: false },
    ],
    hasMore: false,
};

/** Last step of the workout — no upcoming steps left, "end of workout" hint should show. */
export const MOCK_STEPS_LAST: WorkoutUpcomingSteps = {
    previous: { label: '160W', targetPower: 160, duration: 300, remaining: null, isCurrent: false },
    current: {
        label: 'Ramp 150-100W',
        targetPower: 125,
        duration: 300,
        remaining: 42,
        isCurrent: true,
    },
    upcoming: [],
    hasMore: false,
};

/** Current step just started — progress fill/marker should sit at the very left edge. */
export const MOCK_STEPS_JUST_STARTED: WorkoutUpcomingSteps = {
    previous: { label: '150W', targetPower: 150, duration: 60, remaining: null, isCurrent: false },
    current: {
        label: '200W',
        targetPower: 200,
        duration: 180,
        remaining: 179,
        isCurrent: true,
    },
    upcoming: [
        { label: '150W', targetPower: 150, duration: 120, remaining: null, isCurrent: false },
    ],
    hasMore: true,
};

/**
 * A repeated 2-step segment (40s work / 20s rest), flattened — 2nd repetition's "work" step is
 * current. Proves the list shows individual repetitions, not one row per segment.
 */
export const MOCK_STEPS_REPEATED_SEGMENT: WorkoutUpcomingSteps = {
    previous: { label: '100W', targetPower: 100, duration: 20, remaining: null, isCurrent: false }, // 1st rep's rest
    current: {
        label: '200W',
        targetPower: 200,
        duration: 40,
        remaining: 12,
        isCurrent: true,
    }, // 2nd rep's work
    upcoming: [
        { label: '100W', targetPower: 100, duration: 20, remaining: null, isCurrent: false }, // 2nd rep's rest
        { label: '200W', targetPower: 200, duration: 40, remaining: null, isCurrent: false }, // 3rd rep's work
        { label: '100W', targetPower: 100, duration: 20, remaining: null, isCurrent: false }, // 3rd rep's rest
    ],
    hasMore: true, // more reps / a cooldown still follow
};

/** Compact mode with more steps hidden than shown — proves the "more ahead" hint appears even
 * when the service itself has no more to send (hasMore:false) but compact truncated locally. */
export const MOCK_STEPS_COMPACT_TRUNCATED: WorkoutUpcomingSteps = {
    previous: null,
    current: {
        label: '200W',
        targetPower: 200,
        duration: 60,
        remaining: 30,
        isCurrent: true,
    },
    upcoming: [
        { label: '100W', targetPower: 100, duration: 60, remaining: null, isCurrent: false },
        { label: '200W', targetPower: 200, duration: 60, remaining: null, isCurrent: false },
    ],
    hasMore: false,
};

/** Before start / after completion — no current step. */
export const MOCK_STEPS_NONE: WorkoutUpcomingSteps = {
    previous: null,
    current: null,
    upcoming: [],
    hasMore: false,
};
