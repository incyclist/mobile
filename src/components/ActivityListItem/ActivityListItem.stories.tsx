import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityListItem } from './ActivityListItem';
import { ActivityInfoUI } from 'incyclist-services';

const mockActivity: ActivityInfoUI = {
    id: '1',
    name: 'Evening Commute',
    startTime: new Date().toISOString(),
    summary: {
        duration: 2450,
        totalDistance: 12400,
    }
} as any;

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
        activityInfo: mockActivity,
    },
};

export const WithElevation: Story = {
    args: {
        activityInfo: {
            ...mockActivity,
            name: 'Mountain Climb',
            summary: {
                ...mockActivity.summary,
                totalElevation: { value: 1250, unit: 'm' } as any
            }
        },
    },
};

export const LongTitle: Story = {
    args: {
        activityInfo: {
            ...mockActivity,
            name: 'A Very Long Activity Name That Should Be Truncated Properly In The UI',
        },
    },
};