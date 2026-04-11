import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppsDialog } from './AppsDialog';

const meta: Meta<typeof AppsDialog> = {
    title: 'Components/AppsDialog',
    component: AppsDialog,
    args: {
        visible: true,
        onClose: fn(),
        apps: [
            { name: "Strava", key: "strava", iconUrl: "https://example.com/s.svg", isConnected: true },
            { name: "Intervals.icu", key: "intervals", iconUrl: "https://example.com/i.svg", isConnected: false },
            { name: "Komoot", key: "komoot", iconUrl: "https://example.com/k.svg", isConnected: false },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof AppsDialog>;

export const Default: Story = {};

export const AllDisconnected: Story = {
    args: {
        apps: [
            { name: "Strava", key: "strava", iconUrl: "", isConnected: false },
            { name: "Intervals.icu", key: "intervals", iconUrl: "", isConnected: false },
            { name: "Komoot", key: "komoot", iconUrl: "", isConnected: false },
        ],
    },
};

export const AllConnected: Story = {
    args: {
        apps: [
            { name: "Strava", key: "strava", iconUrl: "", isConnected: true },
            { name: "Intervals.icu", key: "intervals", iconUrl: "", isConnected: true },
            { name: "Komoot", key: "komoot", iconUrl: "", isConnected: true },
        ],
    },
};