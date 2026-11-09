import React from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { PairingSidePanelActionProps } from './types'

const MIN_TOUCH_SIZE = 48

/**
 * The main button in a side panel's pinned area, with an optional line above it. The caller logs the
 * press, since only it knows what the button stands for.
 */
export const PairingSidePanelAction = ({ label, note, onPress }: PairingSidePanelActionProps) => (
    <>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
            <Text style={styles.actionText}>{label}</Text>
        </Pressable>
    </>
)

const styles = StyleSheet.create({
    note: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 6,
    },
    action: {
        minHeight: MIN_TOUCH_SIZE,
        borderRadius: 6,
        backgroundColor: colors.buttonPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    actionText: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        fontWeight: '700',
        textAlign: 'center',
    },
})
