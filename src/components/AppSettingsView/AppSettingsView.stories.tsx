import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { AppSettingsView } from './AppSettingsView';
import { Button } from '../ButtonBar/ButtonBar';

const meta: Meta<typeof AppSettingsView> = {
    title: 'Components/AppSettingsView',
    component: AppSettingsView,
    args: {
        title: 'App Settings',
        isConnected: false,
        isConnecting: false,
        connectButton: () => <Button label="Connect" onClick={fn()} />,
        onDisconnect: fn(),
        onBack: fn(),
        onOperationsChanged: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof AppSettingsView>;

export const Default: Story = {
    args: {
        title: 'Strava Integration',
    },
};

export const Connected: Story = {
    args: {
        title: 'Strava Integration',
        isConnected: true,
        operations: [
            { operation: 'RouteDownload', enabled: true },
            { operation: 'ActivityUpload', enabled: false },
        ],
    },
};

export const Connecting: Story = {
    args: {
        title: 'Strava Integration',
        isConnecting: true,
    },
};

export const Compact: Story = {
    args: {
        title: 'Strava Integration',
        compact: true,
    },
};