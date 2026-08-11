import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AttachmentChip } from './AttachmentChip';
import { MainBackground } from '../MainBackground';

const styles = StyleSheet.create({
    container: { padding: 20 },
});

const meta: Meta<typeof AttachmentChip> = {
    title: 'Components/AttachmentChip',
    component: AttachmentChip,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={styles.container}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
    args: {
        label: 'Route',
        name: 'Alblasserwaard (SD)',
        onClear: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof AttachmentChip>;

export const Route: Story = {};

export const Workout: Story = {
    args: { label: 'Workout', name: 'VO2 Max Intervals' },
};

export const LongName: Story = {
    args: { label: 'Route', name: 'A Very Long Route Name That Should Truncate Gracefully In The Chip' },
};
