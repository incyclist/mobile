import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PairingHelperPanel } from './PairingHelperPanel'
import { colors } from '../../theme'
import {
    buildAsleepHelper, buildNoDeviceHelper, buildNoTrainerHelper, buildResolvedHelper, buildTrainerUnavailableHelper,
} from './PairingHelperPanel.mock'

const handlers = () => ({ onOpen: fn(), onDismiss: fn(), onSelect: fn(), onAction: fn() })

const meta: Meta<typeof PairingHelperPanel> = {
    title: 'Components/PairingHelperPanel',
    component: PairingHelperPanel,
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

type Story = StoryObj<typeof PairingHelperPanel>

export const NothingPicked: Story = {
    args: { helper: buildNoTrainerHelper(handlers()) },
}

export const AsleepPhone: Story = {
    args: { helper: buildAsleepHelper(handlers()) },
}

export const AsleepTablet: Story = {
    args: { helper: buildAsleepHelper(handlers()), layout: 'tablet' },
}

export const NoDevicePhone: Story = {
    args: { helper: buildNoDeviceHelper(handlers()) },
}

export const TrainerUnavailablePhone: Story = {
    args: { helper: buildTrainerUnavailableHelper(handlers()) },
}

export const TrainerUnavailableTablet: Story = {
    args: { helper: buildTrainerUnavailableHelper(handlers()), layout: 'tablet' },
}

export const Resolved: Story = {
    args: { helper: buildResolvedHelper(handlers()) },
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
