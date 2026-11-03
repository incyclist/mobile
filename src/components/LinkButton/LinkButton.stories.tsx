import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { LinkButton } from './LinkButton';
import { colors } from '../../theme/colors';

const meta: Meta<typeof LinkButton> = {
    title: 'Components/LinkButton',
    component: LinkButton,
    args: {
        onPress: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof LinkButton>;

export const Default: Story = {
    args: { label: 'How to get Street View' },
};

export const External: Story = {
    args: { label: 'How to create a key', external: true },
};

export const Disabled: Story = {
    args: { label: 'How to get Street View', disabled: true },
};

const styles = StyleSheet.create({
    decorator: {
        width: 360,
        padding: 16,
        backgroundColor: colors.background,
    },
});
