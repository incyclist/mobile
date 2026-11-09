import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ConflictStepRows } from './ConflictStepRows'
import { colors } from '../../theme'
import { buildDetectionConflict, buildManualConflict } from './ConflictStepRows.mock'

const meta: Meta<typeof ConflictStepRows> = {
    title: 'Components/ConflictStepRows',
    component: ConflictStepRows,
    args: {
        onChoice: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof ConflictStepRows>

export const KeepEverything: Story = {
    args: { rows: buildDetectionConflict().rows },
}

export const OneReplaced: Story = {
    args: { rows: buildManualConflict({}, { speed: 'replace' }).rows },
}

// the width of the panel beside the tiles on a phone
const styles = StyleSheet.create({
    decorator: {
        width: 300,
        padding: 12,
        backgroundColor: colors.helperPanelBackground,
    },
})
