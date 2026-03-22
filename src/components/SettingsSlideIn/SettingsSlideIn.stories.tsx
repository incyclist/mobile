import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SettingsSlideIn } from './SettingsSlideIn';

const meta: Meta<typeof SettingsSlideIn> = {
    title: 'Components/SettingsSlideIn',
    component: SettingsSlideIn,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            return (
                <View style={{ width, height, position: 'relative', backgroundColor: '#333' }}>
                    <Story />
                </View>
            );
        },
    ],
    args: {
        onClose: fn(),
        onSectionPress: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof SettingsSlideIn>;

const MOCK_SECTIONS = [
    { label: 'Gear', onPress: () => {} },
    { label: 'Ride', onPress: () => {} },
    { label: 'Apps', onPress: () => {} },
    { label: 'Support', onPress: () => {} },
];

export const Open: Story = {
    args: {
        visible: true,
        sections: MOCK_SECTIONS,
    },
};

export const Closed: Story = {
    args: {
        visible: false,
        sections: MOCK_SECTIONS,
    },
};