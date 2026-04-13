import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityListItem } from './ActivityListItem';

const meta: Meta<typeof ActivityListItem> = {
    title: 'Components/ActivityListItem',
    component: ActivityListItem,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
    args: {
        onPress: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivityListItem>;

export const Default: Story = {
    args: {
        activityInfo: {
            summary: {
                id: 'act-1',
                title: 'Morning Ride',
                startTime: 1744444800000,
                rideTime: 3720,
                distance: { value: 32.4, unit: 'km' },
            },
            details: undefined,
        },
    },
};

export const Compact: Story = {
    args: {
        ...Default.args,
        compact: true,
    },
};

export const FallbackTitle: Story = {
    args: {
        activityInfo: {
            summary: {
                id: 'act-2',
                title: 'Incyclist Ride',
                startTime: 1744444800000,
                rideTime: 1800,
                distance: 15000,
            },
            details: {
                route: {
                    title: 'Alpine Pass',
                },
            },
        },
    },
};

export const NoDetails: Story = {
    args: {
        activityInfo: {
            summary: {
                id: 'act-3',
                title: 'No Data Ride',
                startTime: 1744444800000,
                rideTime: 600,
                distance: 5000,
            },
            details: undefined,
        },
    },
};

const styles = StyleSheet.create({
    decorator: {
        padding: 20,
        backgroundColor: '#1E1E1E',
        flex: 1,
    },
});