import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppsSettingsView } from './AppsSettingsView';

const meta: Meta<typeof AppsSettingsView> = {
    title: 'Components/AppsSettings',
    component: AppsSettingsView,
    args: {
        onSelect: fn(),
        onBack: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof AppsSettingsView>;

export const Default: Story = {
    args: {
        apps: [
            { name: 'Strava', key: 'strava', iconUrl: 'https://placeholder.com/strava.svg', isConnected: true },
            { name: 'Komoot', key: 'komoot', iconUrl: 'https://placeholder.com/komoot.svg', isConnected: false },
            { name: 'Intervals.icu', key: 'intervals', iconUrl: 'https://placeholder.com/intervals.png', isConnected: false },
        ],
    },
};

export const Compact: Story = {
    args: {
        ...Default.args,
        compact: true,
    },
};

export const Empty: Story = {
    args: {
        apps: [],
    },
};