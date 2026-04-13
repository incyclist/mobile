import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';

const meta: Meta<typeof ActivityDetailsDialogView> = {
    title: 'Components/ActivityDetailsDialog',
    component: ActivityDetailsDialogView,
    args: {
        loading: false,
        showMap: false,
        canStart: true,
        activity: {
            title: 'Morning Ride',
            startTime: new Date().toISOString(),
            distance: 12500,
            time: 3600,
            totalElevation: 245,
            fileName: 'activity.json',
            tcxFileName: 'activity.tcx',
            fitFileName: 'activity.fit',
            stats: {
                speed: { avg: 25.4, min: 0, max: 45.2 },
                power: { avg: 185, min: 0, max: 450, weighted: 210 },
                hrm: { avg: 145, min: 65, max: 180 },
                cadence: { avg: 85, min: 0, max: 110 },
            },
            logs: [],
        } as any,
        uploads: [
            { type: 'Strava', status: 'success', url: 'https://strava.com/activities/1' },
            { type: 'TrainingPeaks', status: 'failed' },
        ],
        units: { speed: 'km/h', distance: 'km', elevation: 'm' } as any,
        onClose: fn(),
        onRideAgain: fn(),
        onShareFile: fn(),
        onUpload: fn(),
        onOpenUpload: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivityDetailsDialogView>;

export const Default: Story = {};

export const Loading: Story = {
    args: {
        loading: true,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
    },
};

export const NoMap: Story = {
    args: {
        showMap: false,
    },
};