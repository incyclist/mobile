import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StopWorkoutToast } from './StopWorkoutToast';
import { colors } from '../../theme';

/**
 * "Workout stopped — Undo" (workout-mobile-hld-phase2.md §8.3, session 5.3). The actual undo
 * window/deferred-commit timing lives in `WorkoutRideOverlay`, not here — this story just confirms
 * the toast itself reads correctly.
 */
const meta: Meta<typeof StopWorkoutToast> = {
    title: 'Components/WorkoutDashboard/StopWorkoutToast',
    component: StopWorkoutToast,
    args: {
        onUndo: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.frame}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof StopWorkoutToast>;

export const Default: Story = {};

const styles = StyleSheet.create({
    frame: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
