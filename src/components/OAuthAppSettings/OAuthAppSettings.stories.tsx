import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { OAuthAppSettings } from './OAuthAppSettings';

const meta: Meta<typeof OAuthAppSettings> = {
    component: OAuthAppSettings,
    title: 'Components/OAuthAppSettings',
    args: {
        appKey: 'strava',
        onBack: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof OAuthAppSettings>;

export const Strava: Story = {
    args: {
        appKey: 'strava',
    },
};

export const Intervals: Story = {
    args: {
        appKey: 'intervals',
    },
};