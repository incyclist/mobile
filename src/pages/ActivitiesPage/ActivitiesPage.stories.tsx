import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivitiesPageView } from './ActivitiesPageView';

const meta: Meta<typeof ActivitiesPageView> = {
    title: 'Pages/ActivitiesPage',
    component: ActivitiesPageView,
    args: {
        onSelectActivity: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivitiesPageView>;

export const Loading: Story = {
    args: {
        props: {
            loading: true,
            activities: [],
            detailActivityId: undefined,
        },
    },
};

export const Empty: Story = {
    args: {
        props: {
            loading: false,
            activities: [],
            detailActivityId: undefined,
        },
    },
};

export const WithData: Story = {
    args: {
        props: {
            loading: false,
            activities: [
                {
                    summary: {
                        id: 'act-1',
                        title: 'Morning Ride',
                        startTime: 1744444800000,
                        rideTime: 3600,
                        distance: { value: 30, unit: 'km' },
                    },
                    details: undefined,
                },
                {
                    summary: {
                        id: 'act-2',
                        title: 'Afternoon Shred',
                        startTime: 1744531200000,
                        rideTime: 7200,
                        distance: 60000,
                    },
                    details: undefined,
                },
            ],
            detailActivityId: undefined,
        } as any,
    },
};