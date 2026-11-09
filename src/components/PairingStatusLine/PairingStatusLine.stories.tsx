import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PairingStatusLine } from './PairingStatusLine'
import { colors } from '../../theme'
import {
    MOCK_STATUS_BLUETOOTH_OFF, MOCK_STATUS_SEARCHING, MOCK_STATUS_STILL_SEARCHING, MOCK_STATUS_TRAINER_CONNECTING, MOCK_STATUS_TRAINER_UNAVAILABLE,
} from './PairingStatusLine.mock'

const meta: Meta<typeof PairingStatusLine> = {
    title: 'Components/PairingStatusLine',
    component: PairingStatusLine,
    args: {
        onLinkPress: fn(),
        variant: 'short',
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

type Story = StoryObj<typeof PairingStatusLine>

export const Searching: Story = {
    args: { status: MOCK_STATUS_SEARCHING },
}

export const StillSearching: Story = {
    args: { status: MOCK_STATUS_STILL_SEARCHING },
}

export const StillSearchingFull: Story = {
    args: { status: MOCK_STATUS_STILL_SEARCHING, variant: 'full' },
}

export const TrainerConnecting: Story = {
    args: { status: MOCK_STATUS_TRAINER_CONNECTING },
}

export const TrainerUnavailable: Story = {
    args: { status: MOCK_STATUS_TRAINER_UNAVAILABLE },
}

export const TrainerUnavailableFull: Story = {
    args: { status: MOCK_STATUS_TRAINER_UNAVAILABLE, variant: 'full' },
}

export const TrainerUnavailableStateOnly: Story = {
    args: { status: MOCK_STATUS_TRAINER_UNAVAILABLE, stateOnly: true },
}

export const BluetoothOff: Story = {
    args: { status: MOCK_STATUS_BLUETOOTH_OFF },
}

const styles = StyleSheet.create({
    decorator: {
        padding: 20,
        width: 667,
        backgroundColor: colors.background,
    },
})
