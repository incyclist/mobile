import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SupportSettingsView } from './SupportSettingsView';
import { SUPPORT_DIRECT_PROPS, SUPPORT_WEBSITE_PROPS } from './SupportSettings.mock';

const meta: Meta<typeof SupportSettingsView> = {
    title: 'Components/SupportSettings',
    component: SupportSettingsView,
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
        displayProps: SUPPORT_DIRECT_PROPS,
        compact: false,
        onClose: fn(),
        onShareUuid: fn(),
        onOpenUrl: fn(),
        onDonate: fn(),
        onShareDetails: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof SupportSettingsView>;

export const TabletDirect: Story = {};

export const TabletWebsite: Story = {
    args: { displayProps: SUPPORT_WEBSITE_PROPS },
};

export const PhoneDirect: Story = {
    args: { compact: true },
};

export const PhoneWebsite: Story = {
    args: { compact: true, displayProps: SUPPORT_WEBSITE_PROPS },
};

export const Loading: Story = {
    args: { displayProps: null },
};
