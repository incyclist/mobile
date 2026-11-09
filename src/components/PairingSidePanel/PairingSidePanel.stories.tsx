import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { PairingSidePanel } from './PairingSidePanel'
import { PairingSidePanelAction } from './PairingSidePanelAction'
import { colors, textSizes } from '../../theme'

const Body = () => (
    <View style={styles.body}>
        <Text style={styles.bodyText}>The body</Text>
    </View>
)

const meta: Meta<typeof PairingSidePanel> = {
    title: 'Components/PairingSidePanel',
    component: PairingSidePanel,
    args: {
        title: 'A panel beside the tiles',
        subline: 'A line under the title.',
        onClose: fn(),
        children: <Body />,
    },
    decorators: [
        (Story) => (
            <View style={styles.phone}>
                <Story />
            </View>
        ),
    ],
}

export default meta

type Story = StoryObj<typeof PairingSidePanel>

export const Plain: Story = {}

export const WithTitleNote: Story = {
    args: { titleNote: '1 more' },
}

export const WithPinnedAction: Story = {
    args: { pinned: <PairingSidePanelAction label="Do it" note="A line above the button." onPress={fn()} /> },
}

// the panel's size on a 667 x 375 phone
const styles = StyleSheet.create({
    phone: {
        width: 300,
        height: 337,
        backgroundColor: colors.background,
    },
    body: {
        flex: 1,
        padding: 12,
    },
    bodyText: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
})
