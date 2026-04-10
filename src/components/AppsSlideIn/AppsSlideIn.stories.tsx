import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppsSlideIn } from './AppsSlideIn';

const meta: Meta<typeof AppsSlideIn> = {
    title: 'Components/AppsSlideIn',
    component: AppsSlideIn,
    args: {
        visible: true,
        offsetX: 250,
        apps: [
            { 
                name: 'Strava', 
                key: 'strava', 
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg', 
                isConnected: true 
            },
            { 
                name: 'Komoot', 
                key: 'komoot', 
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Komoot_logo.png', 
                isConnected: false 
            },
        ],
        onSelect: fn(),
        onClose: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof AppsSlideIn>;

export const Default: Story = {};

export const Hidden: Story = {
    args: {
        visible: false,
    },
};

export const NoApps: Story = {
    args: {
        apps: [],
    },
};