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
 * Mock actuals for the (deferred) live overlay — provided now only so session
 * 3.1 has a ready shape to render. Not consumed by strip/detail.
 */
export const MOCK_ACTUALS: WorkoutGraphActuals = {
    power: Array.from({ length: 60 }, (_, i) => ({ x: i * 15, y: 150 + Math.round(Math.sin(i / 4) * 60) })),
    heartrate: Array.from({ length: 60 }, (_, i) => ({ x: i * 15, y: 120 + Math.round(i / 2) })),
    position: 900,
};
