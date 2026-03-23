import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GearSettingsView } from './GearSettingsView';
import { CyclingModeProperyType } from 'incyclist-services';

const meta: Meta<typeof GearSettingsView> = {
    title: 'Components/Settings/Gear',
    component: GearSettingsView,
    args: {
        onClose: fn(),
        onChangeMode: fn(),
        onChangeSetting: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof GearSettingsView>;

const ALL_PROPS = [
    { key: 'i', name: 'Integer', description: '', type: CyclingModeProperyType.Integer, default: 10 },
    { key: 'f', name: 'Float', description: '', type: CyclingModeProperyType.Float, default: 1.5 },
    { key: 's', name: 'String', description: '', type: CyclingModeProperyType.String, default: 'text' },
    { key: 'b', name: 'Boolean', description: '', type: CyclingModeProperyType.Boolean, default: true },
    { key: 'ss', name: 'Small Select', description: '', type: CyclingModeProperyType.SingleSelect, options: ['A', 'B'], default: 'A' },
    { key: 'ls', name: 'Large Select', description: '', type: CyclingModeProperyType.SingleSelect, options: ['1', '2', '3', '4', '5'], default: '1' },
];

const mockModes = [
    {
        getName: () => 'Mode A',
        getProperties: () => ALL_PROPS,
    },
    {
        getName: () => 'Mode B',
        getProperties: () => [],
    },
    {
        getName: () => 'Mode C',
        getProperties: () => [],
    },
];

export const AllTypes: Story = {
    args: {
        mode: 'Mode A',
        options: mockModes as any,
        settings: { i: 20, f: 2.5, s: 'hello', b: false, ss: 'B', ls: '3' },
        properties: ALL_PROPS as any,
    },
};

export const SmallSelect: Story = {
    args: {
        mode: 'Mode A',
        options: [mockModes[0]] as any,
        settings: { ss: 'A' },
        properties: [ALL_PROPS[4]] as any,
    },
};

export const LargeSelect: Story = {
    args: {
        mode: 'Mode A',
        options: [mockModes[0]] as any,
        settings: { ls: '1' },
        properties: [ALL_PROPS[5]] as any,
    },
};

export const ConditionalProperty: Story = {
    args: {
        mode: 'Mode A',
        options: [mockModes[0]] as any,
        settings: { b: false },
        properties: [
            ALL_PROPS[3],
            { key: 'cond', name: 'Conditional', description: '', type: CyclingModeProperyType.String, condition: (s: any) => s.b === true },
        ] as any,
    },
};

export const MultiMode: Story = {
    args: {
        mode: 'Mode A',
        options: mockModes as any,
        settings: {},
        properties: [],
    },
};