import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { ConflictChoiceOption } from './ConflictChoiceOption'
import { ConflictStepRowsProps } from './types'

/**
 * The rows of a device-selection conflict: one per slot that already holds a different device, each
 * with its title and the two choices (keep the current device, or use the new one) stacked under it.
 * The same rows show in the conflict card beside the tiles and in the Resistance list's second step.
 */
export const ConflictStepRows = ({ rows, onChoice }: ConflictStepRowsProps) => (
    <View>
        {rows.map(row => (
            <View key={row.capability} style={styles.row}>
                <Text style={styles.rowTitle}>{row.capabilityTitle.toUpperCase()}</Text>
                <ConflictChoiceOption
                    capability={row.capability} capabilityTitle={row.capabilityTitle}
                    choice="keep" label={row.keepLabel} selected={row.choice === 'keep'} onChoice={onChoice}
                />
                <ConflictChoiceOption
                    capability={row.capability} capabilityTitle={row.capabilityTitle}
                    choice="replace" label={row.replaceLabel} selected={row.choice === 'replace'} onChoice={onChoice}
                />
            </View>
        ))}
    </View>
)

const styles = StyleSheet.create({
    row: {
        marginBottom: 6,
    },
    rowTitle: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
        marginBottom: 4,
    },
})
