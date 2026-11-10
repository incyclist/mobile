import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { ConflictChoiceOption } from './ConflictChoiceOption'
import { ConflictRowsLayout, ConflictStepRowsProps } from './types'

// wide enough for "HEARTRATE"; a longer name wraps to a second line
const LABEL_WIDTH = 90

const choicesStyleOf = (layout: ConflictRowsLayout) => {
    if (layout === 'label-column')
        return styles.choicesBesideLabel
    if (layout === 'side-by-side')
        return styles.choicesSideBySide
    return styles.choicesStacked
}

/**
 * The rows of a device-selection conflict: one per slot that already holds a different device, each
 * with the slot's name and the two choices (keep the current device, or use the new one):
 * - `label-column` (phone): one line per row, the name in a column on the left, then the two choices.
 *   The column holds no buttons, so every row has room to start a scroll from;
 * - `side-by-side`: the name above, the two choices on one line under it;
 * - `stacked`: the name above, the two choices under each other.
 * The same rows show in the dialog for a device found by the search and in the Resistance list's second step.
 */
export const ConflictStepRows = ({ rows, onChoice, layout = 'stacked' }: ConflictStepRowsProps) => {
    const labelColumn = layout === 'label-column'
    const fill = layout !== 'stacked'
    const choicesStyle = choicesStyleOf(layout)

    return (
        <View>
            {rows.map(row => (
                <View key={row.capability} testID={`conflict-row-${row.capability}`} style={labelColumn ? styles.rowLine : styles.row}>
                    <Text style={labelColumn ? styles.label : styles.rowTitle}>{row.capabilityTitle.toUpperCase()}</Text>
                    <View testID={`conflict-choices-${row.capability}`} style={choicesStyle}>
                        <ConflictChoiceOption
                            capability={row.capability} capabilityTitle={row.capabilityTitle} fill={fill}
                            choice="keep" label={row.keepLabel} selected={row.choice === 'keep'} onChoice={onChoice}
                        />
                        <ConflictChoiceOption
                            capability={row.capability} capabilityTitle={row.capabilityTitle} fill={fill}
                            choice="replace" label={row.replaceLabel} selected={row.choice === 'replace'} onChoice={onChoice}
                        />
                    </View>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        marginBottom: 8,
    },
    rowLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    rowTitle: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
        marginBottom: 4,
    },
    label: {
        width: LABEL_WIDTH,
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
    choicesStacked: {
        flexDirection: 'column',
    },
    choicesSideBySide: {
        flexDirection: 'row',
        gap: 8,
    },
    choicesBesideLabel: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
})
