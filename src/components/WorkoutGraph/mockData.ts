import { WorkoutGraphActuals, WorkoutGraphPlan, WorkoutGraphPlanBar } from './types';

/**
 * Hand-authored mock data conforming to the real `workout-ride-page-service-design.md`
 * §3.1 shapes. Stands in for the not-yet-existing `getWorkoutGraphSeries()` generator
 * so the session-1.3 spike (strip/detail modes) can be exercised in Storybook/tests.
 *
 * Represents a ~35-minute structured session at FTP 230 W:
 *   warmup ramp -> endurance -> tempo -> 3x VO2 (on/off) -> cooldown ramp.
 * Includes single-value steps (y0=0) and banded ramp steps (y0>0) so both
 * rectangle shapes are covered. Watts are absolute (already FTP-resolved).
 */

const FTP = 230;

// zone thresholds (matching getZoneColor): 1<=55% 2<=75% 3<=90% 4<=105% 5<=120% 6<=150% 7>150%
const MOCK_BARS: WorkoutGraphPlanBar[] = [
    // warmup ramp 120 -> 175 W  (banded step, y0 > 0)
    { x0: 0,    x: 300,  y: 175, y0: 120, zone: 2 },
    // endurance 160 W
    { x0: 300,  x: 600,  y: 160, y0: 0,   zone: 2 },
    // tempo 200 W
    { x0: 600,  x: 900,  y: 200, y0: 0,   zone: 3 },
    // 3x VO2:  3min @ 280 W (on) / 2min @ 130 W (off)
    { x0: 900,  x: 1080, y: 280, y0: 0,   zone: 6 },
    { x0: 1080, x: 1200, y: 130, y0: 0,   zone: 2 },
    { x0: 1200, x: 1380, y: 280, y0: 0,   zone: 6 },
    { x0: 1380, x: 1500, y: 130, y0: 0,   zone: 2 },
    { x0: 1500, x: 1680, y: 280, y0: 0,   zone: 6 },
    { x0: 1680, x: 1800, y: 130, y0: 0,   zone: 2 },
    // cooldown ramp 150 -> 100 W (banded step, y0 > 0)
    { x0: 1800, x: 2100, y: 150, y0: 100, zone: 1 },
];

const maxPower = MOCK_BARS.reduce((m, b) => Math.max(m, b.y), 0);

export const MOCK_PLAN: WorkoutGraphPlan = {
    bars: MOCK_BARS,
    ftp: FTP,
    ftpLine: FTP,
    domain: {
        x: [0, 2100],
        y: [0, Math.round(maxPower * 1.1)],
    },
};

/** A short, flat-ish workout to exercise the strip thumbnail at small sizes. */
export const MOCK_PLAN_SHORT: WorkoutGraphPlan = {
    bars: [
        { x0: 0,   x: 120, y: 150, y0: 0, zone: 2 },
        { x0: 120, x: 240, y: 240, y0: 0, zone: 4 },
        { x0: 240, x: 360, y: 150, y0: 0, zone: 2 },
        { x0: 360, x: 480, y: 300, y0: 0, zone: 7 },
        { x0: 480, x: 600, y: 120, y0: 0, zone: 1 },
    ],
    ftp: FTP,
    ftpLine: FTP,
    domain: { x: [0, 600], y: [0, 330] },
};

/**
 * Mock actuals for the `live` overlay — a Power line + a Heartrate line,
 * recorded up to `position`. Not consumed by strip/detail.
 */
export const MOCK_ACTUALS: WorkoutGraphActuals = {
    power: Array.from({ length: 60 }, (_, i) => ({ x: i * 15, y: 150 + Math.round(Math.sin(i / 4) * 60) })),
    heartrate: Array.from({ length: 60 }, (_, i) => ({ x: i * 15, y: 120 + Math.round(i / 2) })),
    position: 900,
};

/**
 * Builds a plausible recorded-power series that tracks near each bar's target
 * (mid-band for ramps) with some jitter, standing in for real `activity.logs`
 * samples. Used by the `live`-mode stories below.
 */
const buildActualPower = (bars: WorkoutGraphPlanBar[], endTime: number, stepSec = 15) => {
    const points: { x: number; y: number }[] = [];
    for (let t = 0; t <= endTime; t += stepSec) {
        const bar = bars.find(b => t >= b.x0 && t < b.x) ?? bars[bars.length - 1];
        const target = bar.y0 > 0 ? (bar.y0 + bar.y) / 2 : bar.y;
        const jitter = Math.round(Math.sin(t / 45) * 12 + Math.cos(t / 17) * 6);
        points.push({ x: t, y: Math.max(0, target - 10 + jitter) });
    }
    return points;
};

/** Builds a plausible recorded-heartrate series, gently rising over the ride. */
const buildActualHeartrate = (endTime: number, stepSec = 15) => {
    const points: { x: number; y: number }[] = [];
    for (let t = 0; t <= endTime; t += stepSec) {
        points.push({ x: t, y: Math.round(115 + (t / endTime) * 45 + Math.sin(t / 60) * 4) });
    }
    return points;
};

/**
 * `live` mode, mid-workout: the current workout still equals the pristine
 * plan (no skip has happened yet) — the rider is ~half-way through the 3x
 * VO2 block. Exercises the "bars span the whole workout, actuals overlaid on
 * the already-ridden span only" behavior (workout-ride-page-service-design.md
 * §3.1).
 */
export const MOCK_PLAN_LIVE_MID: WorkoutGraphPlan = MOCK_PLAN;

export const MOCK_ACTUALS_MID: WorkoutGraphActuals = {
    power: buildActualPower(MOCK_BARS, 1050),
    heartrate: buildActualHeartrate(1050),
    position: 1050,
};

/**
 * Same mid-workout snapshot as `MOCK_ACTUALS_MID`, but with no Heartrate data
 * — not every rider pairs an HRM. Exercises `getGraphActuals()`'s "empty
 * heartrate array" contract (§4.5 of the ride-page-service design): the Power
 * line/axis and legend must render normally on their own, with the Heartrate
 * line, its axis, and its legend entry all cleanly omitted (never a broken or
 * empty-but-present HR axis).
 */
export const MOCK_ACTUALS_NO_HRM: WorkoutGraphActuals = {
    power: buildActualPower(MOCK_BARS, 1050),
    heartrate: [],
    position: 1050,
};

/**
 * `live` mode, post-skip-back: the rider skipped back from the cooldown to
 * repeat the last VO2 on/off pair. The CURRENT workout (not the pristine plan
 * above) gets that pair re-inserted at x=1800, and the cooldown ramp shifts
 * 300s later — `domain.x` grows from [0,2100] to [0,2400] accordingly (§3.0 /
 * §3.1: "maxX grows on skip-back/overrun", a discrete jump, not a reflow).
 * The first 9 bars (warmup..last VO2 off) are untouched — proves old bars
 * survive the skip, only the tail is edited. `position` (2250) sits past the
 * pristine plan's old 2100s end, inside the repeated block's shifted
 * cooldown — only renderable at all because the domain grew.
 */
const MOCK_BARS_AFTER_SKIPBACK: WorkoutGraphPlanBar[] = [
    ...MOCK_BARS.slice(0, 9), // warmup .. 3rd VO2 "off" (x=0..1800), unchanged
    // repeated (re-inserted by skip-back) 3rd VO2 on/off pair
    { x0: 1800, x: 1980, y: 280, y0: 0, zone: 6 },
    { x0: 1980, x: 2100, y: 130, y0: 0, zone: 2 },
    // cooldown ramp, shifted 300s later by the re-inserted pair
    { x0: 2100, x: 2400, y: 150, y0: 100, zone: 1 },
];

export const MOCK_PLAN_LIVE_SKIPBACK: WorkoutGraphPlan = {
    bars: MOCK_BARS_AFTER_SKIPBACK,
    ftp: FTP,
    ftpLine: FTP,
    domain: {
        x: [0, 2400],
        y: MOCK_PLAN.domain.y,
    },
};

export const MOCK_ACTUALS_SKIPBACK: WorkoutGraphActuals = {
    power: buildActualPower(MOCK_BARS_AFTER_SKIPBACK, 2250),
    heartrate: buildActualHeartrate(2250),
    position: 2250,
};
