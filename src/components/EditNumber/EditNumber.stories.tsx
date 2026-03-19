import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { EditNumber } from './EditNumber';

const meta: Meta<typeof EditNumber> = {
    title: 'Components/EditNumber',
    component: EditNumber,
    args: {
        label: 'FTP',
        labelWidth: 80,
        value: 250,
        min: 0,
        max: 999,
        unit: 'W',
        digits: 0,
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof EditNumber>;

export const Default: Story = {};

export const Weight: Story = {
    args: {
        label: 'Weight',
        value: 75.5,
        unit: 'kg',
        digits: 1,
    },
};