import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SingleSelect } from './SingleSelect';

const meta: Meta<typeof SingleSelect> = {
    title: 'Components/SingleSelect',
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

export const WithLength: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
        selected: 'Metric',
        length: 12, // Explicitly set length
    },
};

export const WithAutoDerivedLength: Story = {
    args: {
        label: 'Lengthy Options',
        options: ['Short', 'Medium Length', 'Very Very Long Option'],
        selected: 'Medium Length',
        // length is not specified, will be derived from longest option
        // 'Very Very Long Option' is 22 chars. Derived: 22 + 4 = 26.
    },
};