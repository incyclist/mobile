import type { WorkoutDashboardProps } from './types';
import {
    MOCK_PLAN,
    MOCK_PLAN_SHORT,
    MOCK_ACTUALS_MID,
    MOCK_ACTUALS_AT_STEP_BOUNDARY,
} from '../WorkoutGraph/WorkoutGraph.mock';
import {
    MOCK_STEPS_MIXED_TARGETS,
    MOCK_STEPS_VO2,
    MOCK_STEPS_LAST,
    MOCK_STEPS_AT_END,
} from '../WorkoutStepsList/WorkoutStepsList.mock';

/**
 * Hand-authored fixtures covering three representative points in a ride
 * (early workout, mid-interval, near end) — reusing the same `WorkoutGraph`/
 * `WorkoutStepsList` mock data those components already ship, so the three
 * layers (graph plan, actuals, steps) stay mutually consistent.
 */

/** Early workout — warmup ramp just started, no actuals yet (rider hasn't moved past the first samples). */
export const MOCK_DASHBOARD_EARLY: WorkoutDashboardProps = {
    line: { text: '150W - Warmup (1/5)', mode: null },
    graph: MOCK_PLAN,
    steps: MOCK_STEPS_MIXED_TARGETS,
};

/** Mid-interval — inside the repeated VO2 block, with a live actuals overlay (Power/HR + position marker). */
export const MOCK_DASHBOARD_MID_INTERVAL: WorkoutDashboardProps = {
    line: { text: '260W at 100-120HR for 5min - VO2 max (3/5)', mode: null },
    graph: MOCK_PLAN,
    actuals: MOCK_ACTUALS_MID,
    steps: MOCK_STEPS_VO2,
};

/** Near end — last step of the workout, no upcoming steps left ("end of workout" hint shows). */
export const MOCK_DASHBOARD_NEAR_END: WorkoutDashboardProps = {
    line: { text: '120W - Cooldown (5/5)', mode: null },
    graph: MOCK_PLAN,
    actuals: { ...MOCK_ACTUALS_MID, position: 2040 },
    steps: MOCK_STEPS_LAST,
};

/** Short workout, no live actuals overlay yet. */
export const MOCK_DASHBOARD_NO_ACTUALS: WorkoutDashboardProps = {
    line: { text: '200W - Ramp Test', mode: null },
    graph: MOCK_PLAN_SHORT,
    steps: MOCK_STEPS_MIXED_TARGETS,
};

/**
 * The exact instant a step ends (position on the bar boundary, current step's remaining: 0) -
 * repo-owner request, 2026-08-11, to check the graph's position marker lands exactly at the bar
 * edge, and whether WorkoutStepsList's current-row progress fill reaches exactly full rather
 * than stopping short. See `MOCK_ACTUALS_AT_STEP_BOUNDARY`/`MOCK_STEPS_AT_END` for why the
 * fixture deliberately uses mathematically correct boundary values rather than reproducing
 * whatever the live service's tick timing might actually produce.
 */
export const MOCK_DASHBOARD_AT_END: WorkoutDashboardProps = {
    line: { text: '280W - VO2 max (1/3)', mode: null },
    graph: MOCK_PLAN,
    actuals: MOCK_ACTUALS_AT_STEP_BOUNDARY,
    steps: MOCK_STEPS_AT_END,
};
