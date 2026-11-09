import React from 'react';
import { StoryObj, Meta } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { DeviceSelector } from './DeviceSelector';
import { DeviceSelectionProps, TIncyclistCapability } from 'incyclist-services';
import { fn } from 'storybook/test';
import { buildManualConflict } from '../ConflictStepRows/ConflictStepRows.mock';

export const defaultArgs: DeviceSelectionProps = {
    capability: 'control' as TIncyclistCapability,
    devices: [
        {
            connectState: 'connected',
            deviceName: 'DCSIM FTMS .216',
            isSelected: true,
            value: 100,
            interface: 'wifi',
            onClick: fn(),
            onDelete: () => {},
        },
        { deviceName: 'Ant+FE 50040', value: 2, interface: 'ble', onClick: fn(), onDelete: () => {}, isSelected: false },
        { connectState: 'connecting', deviceName: 'Simulator', value: 3, interface: 'wifi', onClick: fn(), onDelete: () => {}, isSelected: false },
        { connectState: 'failed', deviceName: 'Wahoo KICKR 0000', value: 4, interface: 'ble', onClick: fn(), onDelete: () => {}, isSelected: false },
    ],
    isScanning: false,
    disabled: false,
    changeForAll: true,
    canSelectAll: true,
    onClose: fn(),
};

const meta: Meta<DeviceSelectionProps> = {
    title: 'Components/DeviceSelector',
    component: DeviceSelector,
    decorators: [
        (Story) => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                <Story />
            </View>
        ),
    ],
    args: defaultArgs,
};

export default meta;

type Story = StoryObj<DeviceSelectionProps>;

export const Default: Story = {};

export const Scanning: Story = {
    args: {
        ...Default.args,
        isScanning: true,
    },
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        disabled: true,
    },
};

// Regression case for the scroll/overlap bug: with enough entries to overflow the list's
// maxHeight, the last entries must remain reachable by scrolling.
export const LongList: Story = {
    args: {
        ...Default.args,
        devices: Array.from({ length: 25 }, (_, i) => ({
            deviceName: `Device ${i + 1}`,
            value: i,
            interface: i % 2 === 0 ? 'ble' : 'wifi',
            isSelected: false,
            onClick: fn(),
            onDelete: () => {},
        })),
    },
};

// The second step after a pick in the Resistance list that would take slots held by other devices
export const ConflictStep: Story = {
    args: {
        ...Default.args,
        conflictStep: buildManualConflict({ onChoice: fn(), onDone: fn(), onDismiss: fn() }),
    },
};

export const ConflictStepOneReplaced: Story = {
    args: {
        ...Default.args,
        conflictStep: buildManualConflict({ onChoice: fn(), onDone: fn(), onDismiss: fn() }, { power: 'replace' }),
    },
};