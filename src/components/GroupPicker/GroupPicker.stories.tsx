import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GroupPicker } from './GroupPicker';

const meta: Meta<typeof GroupPicker> = {
    title: 'Components/GroupPicker',
    component: GroupPicker,
    args: {
        onValueChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof GroupPicker>;

export const Default: Story = {
    args: {
        label: 'Group',
        groups: ['My Workouts', 'FTP Builder', 'VO2 Max'],
        value: 'My Workouts',
    },
};

export const NoGroupsYet: Story = {
    args: {
        label: 'Group',
        groups: [],
        value: '',
    },
};

export const CustomValueNotInList: Story = {
    args: {
        label: 'Group',
        groups: ['My Workouts', 'FTP Builder'],
        value: 'Winter Base Building',
    },
};

export const ManyGroups: Story = {
    args: {
        label: 'Group',
        groups: ['My Workouts', 'FTP Builder', 'VO2 Max', 'Sweet Spot', 'Recovery', 'Climbing Prep'],
        value: 'Sweet Spot',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Group',
        groups: ['My Workouts', 'FTP Builder'],
        value: 'My Workouts',
        disabled: true,
    },
};

export const NoLabel: Story = {
    args: {
        groups: ['My Workouts', 'FTP Builder'],
        value: 'FTP Builder',
    },
};
