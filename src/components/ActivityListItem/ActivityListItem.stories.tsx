import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityListItem } from './ActivityListItem';

const meta: Meta<typeof ActivityListItem> = {
    title: 'Components/ActivityListItem',
    component: ActivityListItem,
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
                id: '1',
                title: 'Morning Ride',
                startTime: 1744444800000,
                rideTime: 3660,
                distance: { value: 25.5, unit: 'km' },
            },
            details: undefined,
        },
    },
};

export const IncyclistRide: Story = {
    args: {
        activityInfo: {
            summary: {
                id: '2',
                title: 'Incyclist Ride',
                startTime: 1744444800000,
                rideTime: 1800,
                distance: 12500,
            },
            details: {
                route: {
                    title: 'Mont Ventoux',
                },
                logs: [
                    { distance: 0, power: 100 },
                    { distance: 100, power: 150 },
                ],
            } as any,
        },
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        activityInfo: {
            summary: {
                id: '3',
                title: 'Quick Sprint',
                startTime: 1744444800000,
                rideTime: 600,
                distance: 5000,
            },
            details: undefined,
        },
    },
};