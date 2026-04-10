import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppsSettingsView } from './AppsSettingsView';

const meta: Meta<typeof AppsSettingsView> = {
    title: 'Components/AppsSettings',
    component: AppsSettingsView,
    args: {
        onSelect: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof AppsSettingsView>;

export const Default: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: 'https://example.com/strava.svg', isConnected: true },
            { name: 'Komoot', key: 'komoot', iconUrl: 'https://example.com/komoot.svg', isConnected: false },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: 'https://example.com/intervals.png', isConnected: true },
        ],
    },
};

export const Empty: Story = {
    args: {
        apps: [],
    },
};

export const Compact: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: 'https://example.com/strava.svg', isConnected: true },
        ],
        compact: true,
    },
};