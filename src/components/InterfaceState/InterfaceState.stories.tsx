import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { InterfaceState } from './InterfaceState';
import { InterfaceDisplayProps } from './InterfaceState';

const meta: Meta<InterfaceDisplayProps> = {
    title: 'Components/InterfaceState',
    component: InterfaceState,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
    args: {
        onClick: fn(),
    },
};

export default meta;

type Story = StoryObj<InterfaceDisplayProps>;

export const BluetoothScanning: Story = {
    args: {
        name: 'ble',
        state: 'scanning',
    },
};

export const WifiIdle: Story = {
    args: {
        name: 'wifi',
        state: 'idle',
    },
};

export const BluetoothError: Story = {
    args: {
        name: 'ble',
        state: 'error',
        error: 'Connection Failed',
    },
};

export const WifiDisabled: Story = {
    args: {
        name: 'wifi',
        state: 'disabled',
    },
};

const styles = StyleSheet.create({
    decorator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
});