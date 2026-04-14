import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityListItemView } from './ActivityListItemView';

const meta: Meta<typeof ActivityListItemView> = {
    title: 'Components/ActivityListItem',
    component: ActivityListItemView,
    args: {
        onPress: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivityListItemView>;

export const Default: Story = {
    args: {
        title: 'Morning Ride',
        dateStr: '12.04.2025',
        timeStr: '08:00',
        durationStr: '1h 1min',
        distanceValue: '25.5',
        distanceUnit: 'km',
        elevationValue: '',
        elevationUnit: '',
        details: undefined,
        compact: false,
        outsideFold: false,
    },
};

export const IncyclistRide: Story = {
    args: {
        title: 'Mont Ventoux',
        dateStr: '12.04.2025',
        timeStr: '10:00',
        durationStr: '30min',
        distanceValue: '12.5',
        distanceUnit: 'km',
        elevationValue: '0',
        elevationUnit: 'm',
        details: {
            route: {
                title: 'Mont Ventoux',
            },
            logs: [
                { distance: 0, power: 100 },
                { distance: 100, power: 150 },
            ],
        } as any,
        compact: false,
        outsideFold: false,
    },
};

export const WithElevation: Story = {
    args: {
        title: 'Mountain Stage',
        dateStr: '12.04.2025',
        timeStr: '11:00',
        durationStr: '2h 0min',
        distanceValue: '45.2',
        distanceUnit: 'km',
        elevationValue: '1250',
        elevationUnit: 'm',
        details: undefined,
        compact: false,
        outsideFold: false,
    },
};