import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideViewRestrictionNotice } from './RideViewRestrictionNotice';
import { colors } from '../../theme/colors';

const meta: Meta<typeof RideViewRestrictionNotice> = {
    title: 'Components/RideViewRestrictionNotice',
    component: RideViewRestrictionNotice,
    args: {
        onAction: fn(),
        onClose: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof RideViewRestrictionNotice>;

/** Shown for 12s after mount, then closes by itself. */
export const Message: Story = {
    args: {
        notice: {
            id: 1,
            state: 'message',
            text: "Street View isn't available in simulated rides. Showing the Map instead.",
            actions: [
                { id: 'how-to', label: 'How to get Street View' },
                { id: 'dont-show-again', label: "Don't show this again" },
            ],
        },
    },
};

export const Acknowledged: Story = {
    args: {
        notice: {
            id: 1,
            state: 'acknowledged',
            actions: [{ id: 'change-this', label: "We won't show this again. Change this" }],
        },
    },
};

export const Hidden: Story = {
    args: { notice: undefined },
};

const styles = StyleSheet.create({
    decorator: {
        width: 640,
        height: 300,
        backgroundColor: colors.background,
    },
});
