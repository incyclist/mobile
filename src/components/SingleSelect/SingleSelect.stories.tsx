import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SingleSelect } from './SingleSelect';
import { SelectOption } from 'incyclist-services';

const options: SelectOption<string>[] = [
    { label: 'Metric', value: 'metric' },
    { label: 'Imperial', value: 'imperial' },
];

const meta: Meta<typeof SingleSelect> = {
    title: 'Components/SingleSelect',
    component: SingleSelect,
    args: {
        label: 'Units',
        labelWidth: 80,
        options: options,
        selected: 'metric',
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof SingleSelect>;

export const Default: Story = {};

export const ImperialSelected: Story = {
    args: {
        selected: 'imperial',
    },
};