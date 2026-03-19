import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { EditNumber } from './EditNumber';

const meta: Meta<typeof EditNumber> = {
    title: 'Atoms/EditNumber',
    component: EditNumber,
    args: {
        onValueChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EditNumber>;

export const Empty: Story = {
    args: {
        label: 'FTP',
    },
};

export const PreFilled: Story = {
    args: {
        label: 'FTP',
        value: 224,
        unit: 'W',
        digits: 0,
    },
};

export const WithUnit: Story = {
    args: {
        label: 'Weight',
        value: 75.0,
        unit: 'kg',
        digits: 1,
    },
};

export const WithMinMax: Story = {
    args: {
        label: 'FTP',
        value: 224,
        min: 50,
        max: 500,
        unit: 'W',
        digits: 0,
    },
};

export const Disabled: Story = {
    args: {
        label: 'FTP',
        value: 224,
        unit: 'W',
        disabled: true,
    },
};