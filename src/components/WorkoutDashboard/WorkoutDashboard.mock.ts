import type { WorkoutDashboardProps } from './types';
import {
    MOCK_PLAN,
    MOCK_PLAN_SHORT,
    MOCK_ACTUALS_MID,
} from '../WorkoutGraph/WorkoutGraph.mock';
import {
    MOCK_STEPS_MIXED_TARGETS,
    MOCK_STEPS_VO2,
    MOCK_STEPS_LAST,
} from '../WorkoutStepsList/WorkoutStepsList.mock';

/**
 * Hand-authored fixtures covering three representative points in a ride
 * (early workout, mid-interval, near end) — reusing the same `WorkoutGraph`/
 * `WorkoutStepsList` mock data those components already ship, so the three
 * layers (graph plan, actuals, steps) stay mutually consistent.
 */

/** Early workout — warmup ramp just started, no actuals yet (rider hasn't moved past the first samples). */
export const MOCK_DASHBOARD_EARLY: WorkoutDashboardProps = {
    title: 'VO2 Max Builder',
    description: '3x 3min VO2 efforts, warmup and cooldown included.',
    graph: MOCK_PLAN,
    steps: MOCK_STEPS_MIXED_TARGETS,
};

/** Mid-interval — inside the repeated VO2 block, with a live actuals overlay (Power/HR + position marker). */
export const MOCK_DASHBOARD_MID_INTERVAL: WorkoutDashboardProps = {
    title: 'VO2 Max Builder',
    description: '3x 3min VO2 efforts, warmup and cooldown included.',
    graph: MOCK_PLAN,
    actuals: MOCK_ACTUALS_MID,
    steps: MOCK_STEPS_VO2,
};

/** Near end — last step of the workout, no upcoming steps left ("end of workout" hint shows). */
export const MOCK_DASHBOARD_NEAR_END: WorkoutDashboardProps = {
    title: 'VO2 Max Builder',
    description: '3x 3min VO2 efforts, warmup and cooldown included.',
    graph: MOCK_PLAN,
    actuals: { ...MOCK_ACTUALS_MID, position: 2040 },
    steps: MOCK_STEPS_LAST,
};

/** No description supplied — the description line must omit cleanly, not render an empty gap. */
export const MOCK_DASHBOARD_NO_DESCRIPTION: WorkoutDashboardProps = {
    title: 'Short Ramp Test',
    graph: MOCK_PLAN_SHORT,
    steps: MOCK_STEPS_MIXED_TARGETS,
};
