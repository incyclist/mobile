import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SingleSelect } from './SingleSelect';

const meta: Meta<typeof SingleSelect> = {
    title: 'Components/Atoms/SingleSelect',
    component: SingleSelect,
    args: {
        onValueChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof SingleSelect>;

export const TwoOptions: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
        selected: 'Metric',
    },
};

export const NoneSelected: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
    },
};

export const ThreeOptions: Story = {
    args: {
        label: 'Mode',
        options: ['Easy', 'Normal', 'Hard'],
        selected: 'Normal',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
        selected: 'Metric',
        disabled: true,
    },
};