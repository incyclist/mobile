import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SettingsPageView } from './View';

const meta: Meta<typeof SettingsPageView> = {
    title: 'Pages/SettingsPage',
    component: SettingsPageView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            return (
                <View style={{ width, height }}>
                    <Story />
                </View>
            );
        },
    ],
    args: {
        onClose: fn(),
        sections: [
            { label: 'Gear', onPress: fn() },
            { label: 'Ride', onPress: fn() },
            { label: 'Apps', onPress: fn() },
            { label: 'Support', onPress: fn() },
        ],
    },
};

export default meta;

export const Default: StoryObj<typeof SettingsPageView> = {};