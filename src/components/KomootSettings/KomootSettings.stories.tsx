import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { KomootSettingsView } from './KomootSettingsView';

const meta: Meta<typeof KomootSettingsView> = {
    title: 'Components/KomootSettings',
    component: KomootSettingsView,
    args: {
        isConnected: false,
        isConnecting: false,
        operations: [],
        showLoginDialog: false,
        onConnect: fn(),
        onDisconnect: fn(),
        onOperationsChanged: fn(),
        onLoginSuccess: fn(),
        onLoginCancel: fn(),
        onBack: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof KomootSettingsView>;

export const Default: Story = {};

export const Connected: Story = {
    args: {
        isConnected: true,
        operations: [
            { operation: 'ActivityUpload', enabled: true },
            { operation: 'RouteDownload', enabled: false },
        ],
    },
};

export const Connecting: Story = {
    args: {
        isConnecting: true,
        showLoginDialog: true,
    },
};