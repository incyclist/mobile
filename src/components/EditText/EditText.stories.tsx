import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { EditText } from './EditText';

const meta: Meta<typeof EditText> = {
    title: 'Components/EditText',
    component: EditText,
    args: {
        label: 'Name',
        labelWidth: 80,
        value: 'John Doe',
        length: 20,
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof EditText>;

export const Default: Story = {};

export const Empty: Story = {
    args: {
        value: '',
    },
};