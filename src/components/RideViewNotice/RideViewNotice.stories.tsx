import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { RideViewNotice } from './RideViewNotice';
import { colors } from '../../theme/colors';

const meta: Meta<typeof RideViewNotice> = {
    title: 'Components/RideViewNotice',
    component: RideViewNotice,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof RideViewNotice>;

/** Shown for ~8s after mount, then self-dismisses - matches the real fallback flow. */
export const Shown: Story = {
    args: {
        notice: { cause: 'timeout' },
        message: "Street View isn't available right now. Showing the Map instead.",
    },
};

/** No coverage at the rider's current position - never a fallback, can fire repeatedly. */
export const CoverageGap: Story = {
    args: {
        notice: { ts: Date.now() },
        message: 'No Street View imagery at this location.',
    },
};

export const Hidden: Story = {
    args: { notice: undefined, message: '' },
};

const styles = StyleSheet.create({
    decorator: {
        width: 480,
        height: 300,
        backgroundColor: colors.background,
    },
});
