import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutDashboard } from './WorkoutDashboard';
import {
    MOCK_DASHBOARD_EARLY,
    MOCK_DASHBOARD_MID_INTERVAL,
    MOCK_DASHBOARD_NEAR_END,
    MOCK_DASHBOARD_NO_ACTUALS,
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
 * Workout ride page where the workout is the whole screen. These stories are sized to a
 * ~360-420px-wide frame to reflect the "beside RideDashboard" ear placement it actually gets.
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

/** Compact (phone) layout — tighter text/graph, fewer visible steps. */
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
        width: 380,
        padding: 16,
        backgroundColor: colors.background,
    },
    decoratorCompact: {
        width: 300,
    },
});
