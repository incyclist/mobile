import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteSourceInfo } from './RouteSourceInfo';
import { RouteSourceExplainer } from './RouteSourceExplainer';
import { RouteSourcePill } from './RouteSourcePill';

const meta: Meta<typeof RouteSourceInfo> = {
    title: 'Components/RouteSource',
    component: RouteSourceInfo,
    decorators: [
        (Story) => (
            <View style={styles.frame}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof RouteSourceInfo>;

export const PlaysFromComputer: Story = {
    args: { availability: 'fromLink', sourceLabel: 'Den PC' },
};

export const PlaysFromComputerShortHint: Story = {
    args: { availability: 'fromLink', sourceLabel: 'Den PC', shortHint: true },
};

export const Unreachable: Story = {
    args: { availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' },
};

export const NeverReached: Story = {
    args: { availability: 'unavailable', unavailableReason: 'linkNeverReached', sourceLabel: 'Den PC' },
};

export const VersionMismatch: Story = {
    args: { availability: 'unavailable', unavailableReason: 'versionMismatch', sourceLabel: 'Den PC' },
};

export const NoSource: Story = {
    args: { availability: 'unavailable', unavailableReason: 'noSource' },
};

export const Pills: Story = {
    render: () => (
        <View style={styles.row}>
            <RouteSourcePill availability="fromLink" />
            <RouteSourcePill availability="unavailable" />
        </View>
    ),
};

export const ExplainerOneComputer: Story = {
    render: () => <RouteSourceExplainer computerNames={['Den PC']} onDismiss={fn()} />,
};

export const ExplainerSeveralComputers: Story = {
    render: () => <RouteSourceExplainer computerNames={['Den PC', 'Studio Mac']} onDismiss={fn()} />,
};

const styles = StyleSheet.create({
    frame: { padding: 16, backgroundColor: '#1E1E1E', width: 520 },
    row: { flexDirection: 'row', gap: 8 },
});
