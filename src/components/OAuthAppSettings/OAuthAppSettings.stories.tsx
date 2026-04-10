import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { OAuthAppSettings } from './OAuthAppSettings';

const meta: Meta<typeof OAuthAppSettings> = {
    title: 'Components/OAuthAppSettings',
    component: OAuthAppSettings,
    args: {
        onBack: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof OAuthAppSettings>;

export const StravaDisconnected: Story = {
    args: {
        appKey: 'strava',
    },
};

export const IntervalsDisconnected: Story = {
    args: {
        appKey: 'intervals',
    },
};