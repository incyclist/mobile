import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GearSettingsView } from './GearSettingsView';
import { CyclingModeProperyType } from 'incyclist-services';

const meta: Meta<typeof GearSettingsView> = {
    title: 'Components/GearSettings',
    component: GearSettingsView,
    args: {
        onClose: fn(),
        onChangeMode: fn(),
        onChangeSetting: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof GearSettingsView>;

const mockModes = [
    {
        getName: () => 'ERG',
        getProperties: () => [
            {
                key: 'power',
                name: 'Power',
                type: CyclingModeProperyType.Integer,
                min: 0,
                max: 400,
                default: 150,
            },
        ],
    },
    {
        getName: () => 'SIM',
        getProperties: () => [
            {
                key: 'weight',
                name: 'Weight',
                type: CyclingModeProperyType.Float,
                min: 0,
                max: 200,
                default: 75,
            },
        ],
    },
];

export const Default: Story = {
    args: {
        mode: 'ERG',
        options: mockModes as any,
        settings: { power: 200 },
        properties: mockModes[0].getProperties() as any,
    },
};

export const SimMode: Story = {
    args: {
        mode: 'SIM',
        options: mockModes as any,
        settings: { weight: 80.5 },
        properties: mockModes[1].getProperties() as any,
    },
};