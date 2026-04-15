import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Icon } from './Icon';
import { colors, textSizes } from '../../theme';

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
export const Activity: Story = {
    render: () => (
        <View style={styles.row}>
            <Icon name='distance' size={32} />
            <Icon name='elevation' size={32} />
        </View>
    ),
};

export const Route: Story = {
    args: {
        name: 'route',
        size: 64,
        color: colors.tileActive,
    },
};

export const FitnessSensors: Story = {
    render: () => (
        <View style={styles.column}>
            <View style={styles.row}>
                <View style={styles.item}>
                    <Icon name='speed' size={40} color={colors.tileIdle} />
                    <Text style={styles.label}>Speed</Text>
                </View>
                <View style={styles.item}>
                    <Icon name='cadence' size={40} color={colors.buttonPrimary} />
                    <Text style={styles.label}>Cadence</Text>
                </View>
            </View>
            <View style={styles.row}>
                <View style={styles.item}>
                    <Icon name='power' size={40} color={colors.warning} />
                    <Text style={styles.label}>Power</Text>
                </View>
                <View style={styles.item}>
                    <Icon name='heartrate' size={40} color={colors.error} />
                    <Text style={styles.label}>Heart Rate</Text>
                </View>
                <View style={styles.item}>
                    <Icon name='gear' size={40} color={colors.text} />
                    <Text style={styles.label}>Gear</Text>
                </View>
            </View>
        </View>
    ),
};

export const ColorAndSizeVariations: Story = {
    render: () => (
        <View style={styles.column}>
            <Text style={styles.sectionTitle}>Sizes (24, 48, 80)</Text>
            <View style={styles.row}>
                <Icon name='heartrate' size={24} color={colors.error} />
                <Icon name='heartrate' size={48} color={colors.error} />
                <Icon name='heartrate' size={80} color={colors.error} />
            </View>

            <Text style={styles.sectionTitle}>Theme Colors</Text>
            <View style={styles.row}>
                <Icon name='power' size={48} color={colors.text} />
                <Icon name='power' size={48} color={colors.buttonPrimary} />
                <Icon name='power' size={48} color={colors.error} />
                <Icon name='power' size={48} color={colors.tileIdle} />
                <Icon name='power' size={48} color={colors.disabled} />
            </View>
        </View>
    ),
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
    },
    row: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    column: {
        alignItems: 'center',
        gap: 10,
    },
    item: {
        alignItems: 'center',
        width: 100,
    },
    label: {
        color: colors.text,
        marginTop: 8,
        fontSize: textSizes.normalText,
    },
    sectionTitle: {
        color: colors.disabled,
        fontSize: 14,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 20,
    },
});
