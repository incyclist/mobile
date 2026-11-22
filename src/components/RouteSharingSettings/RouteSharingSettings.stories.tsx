import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteSharingSettingsView } from './RouteSharingSettingsView';
import { ALL_ROWS, MOCK_NOW, REACHABLE } from './RouteSharingSettings.mock';

const meta: Meta<typeof RouteSharingSettingsView> = {
    title: 'Components/RouteSharingSettings',
    component: RouteSharingSettingsView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            const frameStyle = { width, height };
            return (
                <View style={frameStyle}>
                    <Story />
                </View>
            );
        },
    ],
    args: {
        mode: 'list',
        rows: ALL_ROWS,
        checking: false,
        searchBlocked: false,
        platform: 'ios',
        now: MOCK_NOW,
        compact: false,
        onClose: fn(),
        onCheckAgain: fn(),
        onAddComputer: fn(),
        onRename: fn(),
        onForget: fn(),
        onOpenIosSettings: fn(),
        onOpenStore: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RouteSharingSettingsView>;

export const TabletList: Story = {};

export const PhoneList: Story = { args: { compact: true } };

export const TabletEmptyIos: Story = { args: { mode: 'empty', rows: [] } };

export const PhoneEmptyAndroid: Story = { args: { mode: 'empty', rows: [], compact: true, platform: 'android' } };

export const Checking: Story = { args: { rows: [REACHABLE], checking: true } };

export const SearchBlocked: Story = { args: { searchBlocked: true } };

export const UpdateRequiredIos: Story = { args: { mode: 'unsupported', rows: [] } };

export const UpdateRequiredAndroid: Story = { args: { mode: 'unsupported', rows: [], platform: 'android', compact: true } };
