import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutDashboard } from './WorkoutDashboard';
import {
    MOCK_DASHBOARD_EARLY,
    MOCK_DASHBOARD_MID_INTERVAL,
    MOCK_DASHBOARD_NEAR_END,
    MOCK_DASHBOARD_NO_ACTUALS,
    MOCK_DASHBOARD_AT_END,
} from './WorkoutDashboard.mock';
import { colors } from '../../theme';
import { Button } from '../ButtonBar';

/**
 * Three representative points in a ride — early workout (nothing ridden yet), mid-interval
 * (inside a repeated VO2 block, live actuals overlay), and near end (last step, "end of
 * workout" hint) — plus a no-actuals edge case. `graphHeight`/`graphMode` are exposed as
 * controls so the Wave 4 prototype session can experiment with sizing directly here
 * (workout-mobile-hld-phase2.md §8, open question 4).
 *
 * Repo-owner review (2026-08-11): this widget must stay compact — not much taller than
 * `RideDashboard` — since on a Video/GPX ride it's auxiliary info, unlike the dedicated
 * Workout ride page where the workout is the whole screen. Height is tight, but *width* is
 * usually generous: in the "block" arrangement (session 1.2/3.2) this widget's width equals
 * `RideDashboard`'s own computed width, which is 700-900px on most tablets — the default
 * story frame reflects that. `NarrowTShape` shows the other extreme, the narrowed T-side
 * width (`WORKOUT_DASH_MIN_WIDTH` = 320, session 3.2), where the graph/steps row is
 * genuinely tight.
 */
const meta: Meta<typeof WorkoutDashboard> = {
    title: 'Components/WorkoutDashboard',
    component: WorkoutDashboard,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutDashboard>;

export const EarlyWorkout: Story = {
    args: MOCK_DASHBOARD_EARLY,
};

export const MidInterval: Story = {
    args: MOCK_DASHBOARD_MID_INTERVAL,
};

export const NearEnd: Story = {
    args: MOCK_DASHBOARD_NEAR_END,
};

export const NoActuals: Story = {
    args: MOCK_DASHBOARD_NO_ACTUALS,
};

/**
 * The exact instant a step ends - `actuals.position` sits precisely on the bar boundary, and
 * the current step's `remaining` is exactly 0. Repo-owner request, 2026-08-11: check the
 * graph's position marker lands exactly at the bar's right edge, and whether
 * `WorkoutStepsList`'s current-row progress fill reaches exactly full width rather than
 * stopping short of it.
 *
 * This fixture uses mathematically correct boundary values (not whatever the live
 * `WorkoutRide.getCurrentLimits()` tick timing happens to produce in practice) so it isolates
 * one question: given correct data, does the *rendering* land exactly at the end? If this looks
 * right here but still looks short of the end on a real device, the gap is in the live
 * service's timing, not in either of these two components - worth separating before filing
 * anything.
 */
export const AtEnd: Story = {
    args: MOCK_DASHBOARD_AT_END,
};

/** Compact (phone) layout — tighter text sizing. */
export const Compact: Story = {
    args: {
        ...MOCK_DASHBOARD_MID_INTERVAL,
        compact: true,
    },
    decorators: [
        (Story) => (
            <View style={[styles.decorator, styles.decoratorCompact]}>
                <Story />
            </View>
        ),
    ],
};

/** The narrowed T-side width (session 3.2's WORKOUT_DASH_MIN_WIDTH) — the tightest real width this widget has to render at. */
export const NarrowTShape: Story = {
    args: MOCK_DASHBOARD_MID_INTERVAL,
    decorators: [
        (Story) => (
            <View style={[styles.decorator, styles.decoratorNarrow]}>
                <Story />
            </View>
        ),
    ],
};

/**
 * The reserved third column with an example control in it — illustrative only, this component
 * does not wire up any Stop-Workout behaviour itself (session 5.3, mechanism TBD by 4.1).
 */
export const WithControlsSlot: Story = {
    args: {
        ...MOCK_DASHBOARD_MID_INTERVAL,
        controls: <Button id="stop" label="Stop" onClick={() => {}} />,
    },
};

const styles = StyleSheet.create({
    decorator: {
        width: 640,
        padding: 16,
        backgroundColor: colors.background,
    },
    decoratorCompact: {
        width: 380,
    },
    decoratorNarrow: {
        width: 320,
    },
});
