import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PasswordEdit } from './PasswordEdit';

const meta: Meta<typeof PasswordEdit> = {
    title: 'Components/PasswordEdit',
    component: PasswordEdit,
    args: {
        label: 'Password',
        value: 'secret123',
        onChangeText: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof PasswordEdit>;

export const Default: Story = {};

export const Compact: Story = {
    args: {
        compact: true,
    },
};

export const WithError: Story = {
    args: {
        hasError: true,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};