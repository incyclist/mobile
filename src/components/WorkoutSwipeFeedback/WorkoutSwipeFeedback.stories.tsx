import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutSwipeFeedback } from './WorkoutSwipeFeedback';
import { colors } from '../../theme/colors';

const meta: Meta<typeof WorkoutSwipeFeedback> = {
    title: 'Components/WorkoutSwipeFeedback',
    component: WorkoutSwipeFeedback,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutSwipeFeedback>;

export const StepBack: Story = {
    args: { visible: true, message: '◀ Step Back' },
};

export const StepForward: Story = {
    args: { visible: true, message: 'Step Forward ▶' },
};

export const LoadIncrease: Story = {
    args: { visible: true, message: '+1%' },
};

export const LoadDecrease: Story = {
    args: { visible: true, message: '-1%' },
};

export const Hidden: Story = {
    args: { visible: false, message: '+1%' },
};

const styles = StyleSheet.create({
    decorator: {
        width: 480,
        height: 300,
        backgroundColor: colors.background,
    },
});
