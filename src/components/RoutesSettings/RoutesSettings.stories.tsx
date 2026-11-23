import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RoutesSettingsView } from './RoutesSettingsView';
import { ALL_CARDS, SERVERS_CARD_WARNING, SHARING_CARD_NOT_SET_UP } from './RoutesSettings.mock';

const meta: Meta<typeof RoutesSettingsView> = {
    title: 'Components/RoutesSettings',
    component: RoutesSettingsView,
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
        cards: ALL_CARDS,
        compact: false,
        onOpenCard: fn(),
        onClose: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RoutesSettingsView>;

export const Tablet: Story = {};

export const Phone: Story = { args: { compact: true } };

export const NotSetUpAndServerWarning: Story = {
    args: { cards: [SERVERS_CARD_WARNING, SHARING_CARD_NOT_SET_UP] },
};
