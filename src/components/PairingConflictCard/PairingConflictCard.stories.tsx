import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PairingConflictCard } from './PairingConflictCard'
import { colors } from '../../theme'
import { buildDetectionConflict, buildQueuedDetectionConflict } from '../ConflictStepRows/ConflictStepRows.mock'

const handlers = () => ({ onChoice: fn(), onDone: fn(), onDismiss: fn() })

const meta: Meta<typeof PairingConflictCard> = {
    title: 'Components/PairingConflictCard',
    component: PairingConflictCard,
    args: {
        layout: 'phone',
    },
    decorators: [
        (Story, ctx) => (
            <View style={ctx.args.layout === 'phone' ? styles.phone : styles.tablet}>
                <Story />
            </View>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof PairingConflictCard>

export const Phone: Story = {
    args: { conflict: buildDetectionConflict(handlers()) },
}

export const PhoneOneReplaced: Story = {
    args: { conflict: buildDetectionConflict(handlers(), { power: 'replace' }) },
}

export const PhoneMoreWaiting: Story = {
    args: { conflict: buildQueuedDetectionConflict(handlers()) },
}

export const Tablet: Story = {
    args: { conflict: buildDetectionConflict(handlers()), layout: 'tablet' },
}

// the panel's size on a 667 x 375 phone, and on a tablet, below the page title
const styles = StyleSheet.create({
    phone: {
        width: 300,
        height: 337,
        backgroundColor: colors.background,
    },
    tablet: {
        width: 320,
        height: 470,
        backgroundColor: colors.background,
    },
})
