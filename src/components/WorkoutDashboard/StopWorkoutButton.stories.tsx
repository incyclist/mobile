import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StopWorkoutButton } from './StopWorkoutButton';
import { colors } from '../../theme';

/**
 * "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3). Pure,
 * mock-driven — no `incyclist-services` runtime dependency, same convention as the rest of this
 * folder's stories.
 */
const meta: Meta<typeof StopWorkoutButton> = {
    title: 'Components/WorkoutDashboard/StopWorkoutButton',
    component: StopWorkoutButton,
    args: {
        onPress: fn(),
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

type Story = StoryObj<typeof StopWorkoutButton>;

export const Default: Story = {};

export const Compact: Story = {
    args: { compact: true },
};

export const Disabled: Story = {
    args: { disabled: true },
};

const styles = StyleSheet.create({
    frame: {
        padding: 24,
        backgroundColor: colors.background,
    },
});
