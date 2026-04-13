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
            } as any,
            details: undefined,
        },
    },
};

export const WithElevation: Story = {
    args: {
        activityInfo: {
            summary: {
                id: 'act-2',
                title: 'Mountain Stage',
                startTime: 1744444800000,
                rideTime: 7200,
                distance: 45000,
                totalElevation: { value: 1250, unit: 'm' },
            } as any,
            details: undefined,
        },
    },
};

export const FallbackTitle: Story = {
    args: {
        activityInfo: {
            summary: {
                id: 'act-3',
                title: 'Incyclist Ride',
                startTime: 1744444800000,
                rideTime: 1800,
                distance: 15000,
            } as any,
            details: {
                route: {
                    title: 'Alpine Pass',
                },
            } as any,
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