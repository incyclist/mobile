import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Icon } from './Icon';
import { colors } from '../../theme';

const meta: Meta<typeof Icon> = {
    title: 'Components/Icon',
    component: Icon,
    decorators: [
        (Story) => (
            <View style={styles.container}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Funnel: Story = {
    args: {
        name: 'funnel',
        size: 48,
        color: colors.buttonPrimary,
    },
};

export const Navigation: Story = {
    render: () => (
        <View style={styles.row}>
            <Icon name='chevron-up' size={32} />
            <Icon name='chevron-down' size={32} />
        </View>
    ),
};

export const Actions: Story = {
    render: () => (
        <View style={styles.row}>
            <Icon name='plus' size={32} />
            <Icon name='import-route' size={32} />
        </View>
    ),
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
});
