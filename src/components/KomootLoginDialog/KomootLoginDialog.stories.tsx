import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { KomootLoginDialogView } from './KomootLoginDialogView';

const meta: Meta<typeof KomootLoginDialogView> = {
    title: 'Components/KomootLoginDialog',
    component: KomootLoginDialogView,
    args: {
        isConnecting: false,
        onUsernameChange: fn(),
        onPasswordChange: fn(),
        onUseridChange: fn(),
        onConnect: fn(),
        onCancel: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof KomootLoginDialogView>;

export const Default: Story = {
    args: {
        username: 'test@user.com',
        userid: '12345',
    },
};

export const Connecting: Story = {
    args: {
        isConnecting: true,
    },
};

export const WithError: Story = {
    args: {
        errorMessage: 'Authentication failed. Please check your credentials.',
    },
};