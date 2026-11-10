import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { ConflictChoiceOption } from './ConflictChoiceOption'
import { ConflictStepRowsProps } from './types'

/**
 * The rows of a device-selection conflict: one per slot that already holds a different device, each
 * with its title and the two choices (keep the current device, or use the new one) - side by side on
 * one line, or stacked under each other where the dialog is too narrow for that.
 * The same rows show in the dialog for a device found by the search and in the Resistance list's second step.
 */
export const ConflictStepRows = ({ rows, onChoice, sideBySide = false }: ConflictStepRowsProps) => (
    <View>
        {rows.map(row => (
            <View key={row.capability} style={styles.row}>
                <Text style={styles.rowTitle}>{row.capabilityTitle.toUpperCase()}</Text>
                <View
                    testID={`conflict-choices-${row.capability}`}
                    style={sideBySide ? styles.choicesSideBySide : styles.choicesStacked}
                >
                    <ConflictChoiceOption
                        capability={row.capability} capabilityTitle={row.capabilityTitle} fill={sideBySide}
                        choice="keep" label={row.keepLabel} selected={row.choice === 'keep'} onChoice={onChoice}
                    />
                    <ConflictChoiceOption
                        capability={row.capability} capabilityTitle={row.capabilityTitle} fill={sideBySide}
                        choice="replace" label={row.replaceLabel} selected={row.choice === 'replace'} onChoice={onChoice}
                    />
                </View>
            </View>
        ))}
    </View>
)

const styles = StyleSheet.create({
    row: {
        marginBottom: 4,
    },
    rowTitle: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
        marginBottom: 4,
    },
    choicesStacked: {
        flexDirection: 'column',
    },
    choicesSideBySide: {
        flexDirection: 'row',
        gap: 8,
    },
})
