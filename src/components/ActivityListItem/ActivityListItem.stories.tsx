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
            } as any,
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
            } as any,
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

export const WithElevation: Story = {
    args: {
        activityInfo: {
            summary: {
                id: '4',
                title: 'Mountain Stage',
                startTime: 1744444800000,
                rideTime: 7200,
                distance: { value: 45.2, unit: 'km' },
                totalElevation: { value: 1250, unit: 'm' },
            } as any,
            details: undefined,
        },
    },
};