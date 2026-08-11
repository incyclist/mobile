import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutDashboard } from './WorkoutDashboard';
import {
    MOCK_DASHBOARD_EARLY,
    MOCK_DASHBOARD_MID_INTERVAL,
    MOCK_DASHBOARD_NEAR_END,
    MOCK_DASHBOARD_NO_DESCRIPTION,
} from './WorkoutDashboard.mock';
import { colors } from '../../theme';

/**
 * Three representative points in a ride — early workout (nothing ridden yet), mid-interval
 * (inside a repeated VO2 block, live actuals overlay), and near end (last step, "end of
 * workout" hint) — plus a no-description edge case. `graphHeight`/`graphMode` are exposed
 * as controls so the Wave 4 prototype session can experiment with sizing directly here
 * (workout-mobile-hld-phase2.md §8, open question 4).
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

export const NoDescription: Story = {
    args: MOCK_DASHBOARD_NO_DESCRIPTION,
};

/** Compact (phone) layout — tighter title/description type, one fewer upcoming step. */
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

/** A smaller graph height, standing in for the "narrower overlay" T-shape arrangement (§5.3). */
export const SmallGraph: Story = {
    args: {
        ...MOCK_DASHBOARD_MID_INTERVAL,
        graphHeight: 80,
    },
};

const styles = StyleSheet.create({
    decorator: {
        width: 360,
        padding: 16,
        backgroundColor: colors.background,
    },
    decoratorCompact: {
        width: 260,
    },
});
