import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ChipSelect } from './ChipSelect';

const meta: Meta<typeof ChipSelect> = {
    title: 'Components/ChipSelect',
    component: ChipSelect,
    args: {
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ChipSelect>;

export const TwoOptions: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
        selected: 'Metric',
    },
};

export const ThreeOptions: Story = {
    args: {
        label: 'Mode',
        options: ['Easy', 'Normal', 'Hard'],
        selected: 'Normal',
    },
};

export const FourOptions: Story = {
    args: {
        label: 'Size',
        options: ['XS', 'S', 'M', 'L'],
        selected: 'M',
    },
};

export const NoneSelected: Story = {
    args: {
        label: 'Units',
        options: ['Metric', 'Imperial'],
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

export const MultiSelect: Story = {
    args: {
        label: 'Sensors',
        options: ['Power', 'HR', 'Speed', 'Cadence'],
        selectedValues: ['Power', 'HR'],
        multi: true,
    },
};

// A per-option disabled state with an explanatory message, mixed with plain-string
// options - e.g. Ride Settings' Satellite View option when the device can't use it.
export const WithDisabledOption: Story = {
    args: {
        label: 'Ride View',
        options: [
            'Street View',
            'Map',
            {
                label: 'Satellite View',
                disabled: true,
                message: 'Install Google Play Services to use this view',
            },
        ],
        selected: 'Street View',
    },
};