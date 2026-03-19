import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { EditText } from './EditText';

const meta: Meta<typeof EditText> = {
    title: 'Components/EditText',
    component: EditText,
    args: {
        onValueChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EditText>;

export const Empty: Story = {
    args: {
        label: 'Name',
        placeholder: 'Enter your name...',
    },
};

export const PreFilled: Story = {
    args: {
        label: 'Name',
        value: 'Guido Doumen',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Name',
        value: 'Guido Doumen',
        disabled: true,
    },
};

export const WithValidation: Story = {
    args: {
        label: 'Username',
        validate: (v) => (v.trim() === '' ? 'Name is required' : null),
    },
};

export const WithLength: Story = {
    args: {
        label: 'Name',
        value: 'Guido Doumen',
        length: 20, // Explicitly set length
    },
};