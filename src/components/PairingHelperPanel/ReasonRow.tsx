import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { PairingHelperReasonProps } from 'incyclist-services'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'

const MIN_ROW_HEIGHT = 48

interface ReasonRowProps {
    reason: PairingHelperReasonProps
    /** the tip shown under the picked answer */
    tip?: string
    /** phone: the tip in the smaller text size */
    compact: boolean
}

/** One answer: a radio-style row at least 48 high, with the tip under it once it's picked. */
export const ReasonRow = ({ reason, tip, compact }: ReasonRowProps) => {
    const { logEvent } = useLogging('PairingHelperPanel')

    const onPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'helper answer', reason: reason.id, eventSource: 'user' })
        reason.onSelect()
    }, [logEvent, reason])

    return (
        <View>
            <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: reason.selected }}
                accessibilityLabel={reason.label}
                onPress={onPress}
                style={[styles.row, reason.selected && styles.rowSelected]}
            >
                <View style={[styles.radio, reason.selected && styles.radioSelected]}>
                    {reason.selected && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.label}>{reason.label}</Text>
            </Pressable>
            {reason.selected && tip ? (
                <View style={styles.tip}>
                    <Text style={[styles.tipText, compact ? styles.tipTextCompact : styles.tipTextFull]}>{tip}</Text>
                </View>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        minHeight: MIN_ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.disabled,
    },
    rowSelected: {
        borderColor: colors.pairingWaiting,
    },
    radio: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioSelected: {
        borderColor: colors.pairingWaiting,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.pairingWaiting,
    },
    label: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.subtitle,
    },
    tip: {
        backgroundColor: colors.helperTipBackground,
        borderRadius: 6,
        padding: 10,
        marginBottom: 6,
    },
    tipText: {
        color: colors.text,
    },
    tipTextCompact: {
        fontSize: textSizes.smallText,
    },
    tipTextFull: {
        fontSize: textSizes.subtitle,
    },
})
