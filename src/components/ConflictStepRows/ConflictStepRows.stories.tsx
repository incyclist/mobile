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
        layout: 'side-by-side',
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

// where the dialog is too narrow for the two choices on one line
export const Stacked: Story = {
    args: { rows: buildDetectionConflict().rows, layout: 'stacked' },
}

// a phone's layout: the capability's name in a column on the left, the choices to its right
export const LabelColumn: Story = {
    args: { rows: buildDetectionConflict().rows, layout: 'label-column' },
}

// about the width of the rows in the conflict dialog on a phone
const styles = StyleSheet.create({
    decorator: {
        width: 440,
        padding: 12,
        backgroundColor: colors.helperPanelBackground,
    },
})
