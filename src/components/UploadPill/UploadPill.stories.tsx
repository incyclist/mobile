import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { UploadPill } from './UploadPill';

const meta: Meta<typeof UploadPill> = {
    title: 'Components/UploadPill',
    component: UploadPill,
    args: {
        onSynchronize: fn(),
        onOpen: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof UploadPill>;

export const Success: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'success',
        url: 'https://strava.com/activities/123',
    },
};

export const Failed: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'failed',
    },
};

export const Unknown: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'unknown',
    },
};

export const Synchronizing: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'unknown',
        synchronizing: true,
    },
};