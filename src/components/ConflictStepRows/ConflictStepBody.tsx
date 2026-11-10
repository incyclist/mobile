import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { ConflictStepRows } from './ConflictStepRows'
import { ConflictStepBodyProps } from './types'

/**
 * The body of a conflict dialog, under its title: how many more conflicts wait (when the page service
 * says so), the subline, and the rows. Both the device list's second step and the dialog for a device
 * found by the search show it, so the two look and read the same.
 */
export const ConflictStepBody = ({ step, compact, onChoice }: ConflictStepBodyProps) => (
    <View style={styles.body}>
        {step.queuedText ? <Text style={styles.queued}>{step.queuedText}</Text> : null}
        <Text style={styles.subline}>{compact ? step.subline.short : step.subline.full}</Text>
        <ConflictStepRows rows={step.rows} onChoice={onChoice} />
    </View>
)

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: 8,
        paddingTop: 4,
    },
    queued: {
        color: colors.text,
        fontSize: textSizes.smallText,
        textAlign: 'right',
        marginBottom: 4,
    },
    subline: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 10,
    },
})
