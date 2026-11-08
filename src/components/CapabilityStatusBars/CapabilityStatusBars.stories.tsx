import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CapabilityStatusBars } from './CapabilityStatusBars'
import { colors } from '../../theme'
import {
    MOCK_CAPABILITIES_HEARTRATE_ONLY, MOCK_CAPABILITIES_SEARCHING, MOCK_CAPABILITIES_SWITCHED_OFF,
    MOCK_CAPABILITIES_TRAINER_CONNECTING, MOCK_CAPABILITIES_TRAINER_UNAVAILABLE,
} from './CapabilityStatusBars.mock'

const meta: Meta<typeof CapabilityStatusBars> = {
    title: 'Components/CapabilityStatusBars',
    component: CapabilityStatusBars,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof CapabilityStatusBars>

export const Searching: Story = {
    args: { capabilities: MOCK_CAPABILITIES_SEARCHING, pairingCase: 'no-trainer' },
}

export const HeartrateOnly: Story = {
    args: { capabilities: MOCK_CAPABILITIES_HEARTRATE_ONLY, pairingCase: 'no-trainer' },
}

export const TrainerConnecting: Story = {
    args: { capabilities: MOCK_CAPABILITIES_TRAINER_CONNECTING, pairingCase: 'trainer-connecting' },
}

export const TrainerUnavailable: Story = {
    args: { capabilities: MOCK_CAPABILITIES_TRAINER_UNAVAILABLE, pairingCase: 'trainer-unavailable' },
}

export const SwitchedOff: Story = {
    args: { capabilities: MOCK_CAPABILITIES_SWITCHED_OFF, readyToStart: true, pairingCase: 'no-trainer' },
}

// the space left beside the helper panel on a 667 x 375 phone
const styles = StyleSheet.create({
    decorator: {
        width: 362,
        paddingVertical: 12,
        backgroundColor: colors.background,
    },
})
