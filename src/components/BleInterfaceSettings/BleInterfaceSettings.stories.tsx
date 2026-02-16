import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { BleInterfaceSettingsView } from './BleInterfaceSettingsView';

const meta: Meta<typeof BleInterfaceSettingsView> = {
    title: 'Components/BleInterfaceSettings',
    component: BleInterfaceSettingsView,
    args: {
        onClose: fn(),
        onEnable: fn(),
        onDisable: fn(),
        onReconnect: fn(),
        onRequestPermissions: fn(),
    },
};

export default meta;

export const Scanning: StoryObj<typeof BleInterfaceSettingsView> = {
    args: {
        state: 'scanning',
        needsPermissions: false,
        enabled: true,
    },
};

export const Disabled: StoryObj<typeof BleInterfaceSettingsView> = {
    args: {
        state: 'idle',
        enabled: false,
        needsPermissions: false,
    },
};

export const Disconnected: StoryObj<typeof BleInterfaceSettingsView> = {
    args: {
        state: 'error',
        enabled: true,
        needsPermissions: false,
    },
};

export const PermissionError: StoryObj<typeof BleInterfaceSettingsView> = {
    args: {
        state: 'error',
        needsPermissions: true,
        enabled: true,
    },
};
export const Loading: StoryObj<typeof BleInterfaceSettingsView> = {
    args: {
        state: 'error',
        needsPermissions: true,
        loading: true,
        enabled: true,
    },
};
