import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { StatusBar } from './StatusBar'
import { getOptionalSummary } from './utils'
import { CapabilityStatusBarsProps } from './types'

/**
 * The tiles in the narrow space beside the helper on a phone: the required row as full-width status
 * bars under a one-line row header, and the optional row collapsed to one summary line. Bars can wrap
 * to two lines where tiles would clip their text at a large font scale.
 */
export const CapabilityStatusBars = ({ capabilities }: CapabilityStatusBarsProps) => {
    if (!capabilities)
        return null

    const top = capabilities.rowLabels?.top
    const bottom = capabilities.rowLabels?.bottom
    const optional = getOptionalSummary(capabilities.bottom ?? [])

    return (
        <View style={styles.container}>
            {top ? (
                <Text style={styles.rowHeader}>
                    <Text style={styles.rowHeaderTitle}>{top.text}</Text>
                    {top.subtext ? ` · ${top.subtext}` : ''}
                </Text>
            ) : null}

            {(capabilities.top ?? []).map(tile => (
                <StatusBar key={tile.capability} tile={tile} />
            ))}

            {optional.length > 0 && (
                <View style={styles.strip}>
                    <Text style={styles.stripText}>
                        <Text style={styles.rowHeaderTitle}>{`${bottom?.text ?? ''}: `}</Text>
                        {optional.map((item, index) => (
                            <Text key={item.title}>
                                {index > 0 ? ' · ' : ''}
                                {item.connected ? <Text style={styles.check}>✓ </Text> : null}
                                {item.title.toUpperCase()}
                            </Text>
                        ))}
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 12,
    },
    rowHeader: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 6,
    },
    rowHeaderTitle: {
        fontWeight: '700',
    },
    strip: {
        borderRadius: 6,
        backgroundColor: colors.helperTipBackground,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    stripText: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
    check: {
        color: colors.success,
    },
})
