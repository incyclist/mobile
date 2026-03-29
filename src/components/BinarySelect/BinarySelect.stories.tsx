import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { BinarySelect } from './BinarySelect';

const meta: Meta<typeof BinarySelect> = {
    title: 'Components/BinarySelect',
    component: BinarySelect,
    args: {
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof BinarySelect>;

export const Default: Story = {
    args: {
        label: 'For all capabilities',
        value: false,
    },
};

export const LabelAfter: Story = {
    args: {
        label: 'None',
        value: true,
        labelPosition: 'after',
    },
};

export const CustomLabels: Story = {
    args: {
        label: 'Units',
        value: true,
        trueLabel: 'Metric',
        falseLabel: 'Imperial',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Settings Lock',
        value: true,
        disabled: true,
    },
};