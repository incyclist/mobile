import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SettingsSlideIn } from './SettingsSlideIn';

const meta: Meta<typeof SettingsSlideIn> = {
    title: 'Components/SettingsSlideIn',
    component: SettingsSlideIn,
    args: {
        isOpen: true,
        onClose: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof SettingsSlideIn>;

const MockContent = () => (
    <View style={{ padding: 20 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
            Settings Panel
        </Text>
        <Text style={{ color: '#9fa4a8', marginTop: 10, fontSize: 16 }}>
            The area to the left is now fully transparent, allowing the 
            main NavigationBar to be visible behind it.
        </Text>
        <Text style={{ color: '#9fa4a8', marginTop: 10, fontSize: 16 }}>
            Tapping anywhere in that transparent zone will trigger onClose.
        </Text>
    </View>
);

export const Open: Story = {
    args: {
        isOpen: true,
        children: <MockContent />,
    },
};

export const Closed: Story = {
    args: {
        isOpen: false,
        children: <MockContent />,
    },
};