import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PairingConflictDialog } from './PairingConflictDialog'
import {
    buildDetectionConflict, buildQueuedDetectionConflict, buildSingleRowDetectionConflict,
} from '../ConflictStepRows/ConflictStepRows.mock'

// Like the device list's dialog, this one sizes itself to the window: resize the preview (or use the
// viewport toolbar) to see the phone's short subline below tablet size.
const handlers = () => ({ onChoice: fn(), onDone: fn(), onDismiss: fn() })

const meta: Meta<typeof PairingConflictDialog> = {
    title: 'Components/PairingConflictDialog',
    component: PairingConflictDialog,
    decorators: [
        (Story) => (
            <View style={styles.centered}>
                <Story />
            </View>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof PairingConflictDialog>

export const MultipleRows: Story = {
    args: { conflict: buildDetectionConflict(handlers()) },
}

export const SingleRow: Story = {
    args: { conflict: buildSingleRowDetectionConflict(handlers()) },
}

export const OneReplaced: Story = {
    args: { conflict: buildDetectionConflict(handlers(), { power: 'replace' }) },
}

export const MoreWaiting: Story = {
    args: { conflict: buildQueuedDetectionConflict(handlers()) },
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
})
