import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteSharingChecklist } from './RouteSharingChecklist';

const meta: Meta<typeof RouteSharingChecklist> = {
    title: 'Components/RouteSharingChecklist',
    component: RouteSharingChecklist,
    decorators: [
        (Story) => (
            <View style={styles.frame}>
                <Story />
            </View>
        ),
    ],
    args: {
        variant: 'reach',
        name: 'Home PC',
        showLocalNetworkHint: false,
        onOpenSettings: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RouteSharingChecklist>;

export const Reach: Story = {};

export const ReachNeverReachedIos: Story = { args: { showLocalNetworkHint: true } };

export const Find: Story = { args: { variant: 'find' } };

export const FindIos: Story = { args: { variant: 'find', showLocalNetworkHint: true } };

const styles = StyleSheet.create({
    frame: {
        padding: 16,
        maxWidth: 640,
        backgroundColor: '#1E1E1E',
    },
});
