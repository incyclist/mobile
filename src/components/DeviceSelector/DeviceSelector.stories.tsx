import React from 'react';
import { StoryObj, Meta } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { DeviceSelector } from './DeviceSelector';
import { DeviceSelectionProps, TIncyclistCapability } from 'incyclist-services';
import { fn } from 'storybook/test';

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
        { connectState: 'disconnected', deviceName: 'Ant+FE 50040', value: 2, interface: 'ble', onClick: fn(), onDelete: () => {} },
        { connectState: 'connecting', deviceName: 'Simulator', value: 3, interface: 'wifi', onClick: fn(), onDelete: () => {} },
        { connectState: 'failed', deviceName: 'Wahoo KICKR 0000', value: 4, interface: 'ble', onClick: fn(), onDelete: () => {} },
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