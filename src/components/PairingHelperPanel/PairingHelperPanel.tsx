import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'
import { ReasonRow } from './ReasonRow'
import { getVisibleReasons } from './utils'
import { PairingHelperPanelProps } from './types'

const MIN_TOUCH_SIZE = 48

/**
 * The "can't find your trainer" helper, as a non-modal panel beside the tiles: a header with the
 * title and close button, the answers in a scrollable body, and the tip's action pinned at the
 * bottom so a large font scale never pushes it off-screen.
 */
export const PairingHelperPanel = ({ helper, layout }: PairingHelperPanelProps) => {
    const { logEvent } = useLogging('PairingHelperPanel')
    const isPhone = layout === 'phone'

    // the answer for which the rider asked to see the other answers again; picking another answer folds them again
    const selectedId = helper.reasons.find(r => r.selected)?.id
    const [expandedFor, setExpandedFor] = useState<string | undefined>(undefined)
    const { visible, folded } = getVisibleReasons(helper.reasons, {
        fold: isPhone,
        expanded: selectedId !== undefined && expandedFor === selectedId,
    })

    const onClose = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'helper close', eventSource: 'user' })
        helper.onDismiss()
    }, [helper, logEvent])

    const onShowOtherAnswers = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'helper other answers', eventSource: 'user' })
        setExpandedFor(selectedId)
    }, [logEvent, selectedId])

    const onAction = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'helper action', eventSource: 'user' })
        helper.action?.onClick()
    }, [helper, logEvent])

    const resolved = helper.phase === 'resolved'
    const tip = isPhone ? helper.tip?.shortText : helper.tip?.text
    const showFooterLine = !isPhone && !resolved
    const showPinned = (!resolved && helper.action !== undefined) || showFooterLine

    return (
        <View style={styles.panel}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} accessibilityRole="header">{helper.title}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        onPress={onClose}
                        style={styles.close}
                    >
                        <Text style={styles.closeText}>✕</Text>
                    </Pressable>
                </View>
                {!resolved && helper.subline ? <Text style={styles.subline}>{helper.subline}</Text> : null}
            </View>

            {resolved ? (
                <View style={styles.resolved}>
                    <Text style={styles.resolvedText}>{helper.resolvedText}</Text>
                </View>
            ) : (
                <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                    {visible.map(reason => (
                        <ReasonRow key={reason.id} reason={reason} tip={tip} compact={isPhone} />
                    ))}
                    {folded && (
                        <Pressable accessibilityRole="button" onPress={onShowOtherAnswers} style={styles.otherAnswers}>
                            <Text style={styles.otherAnswersText}>‹ Other answers</Text>
                        </Pressable>
                    )}
                </ScrollView>
            )}

            {showPinned && (
                <View style={styles.pinned}>
                    {!resolved && helper.action?.note ? <Text style={styles.note}>{helper.action.note}</Text> : null}
                    {!resolved && helper.action ? (
                        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
                            <Text style={styles.actionText}>{helper.action.label}</Text>
                        </Pressable>
                    ) : null}
                    {showFooterLine ? <Text style={styles.footer}>{helper.footer}</Text> : null}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    panel: {
        flex: 1,
        backgroundColor: colors.helperPanelBackground,
        borderLeftWidth: 3,
        borderLeftColor: colors.pairingWaiting,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    header: {
        paddingLeft: 12,
        paddingTop: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
    },
    close: {
        width: MIN_TOUCH_SIZE,
        height: MIN_TOUCH_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    subline: {
        color: colors.text,
        fontSize: textSizes.smallText,
        paddingRight: 12,
        paddingBottom: 6,
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 6,
    },
    otherAnswers: {
        minHeight: MIN_TOUCH_SIZE,
        justifyContent: 'center',
    },
    otherAnswersText: {
        color: colors.link,
        fontSize: textSizes.smallText,
        textDecorationLine: 'underline',
    },
    resolved: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    resolvedText: {
        color: colors.success,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        textAlign: 'center',
    },
    pinned: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.disabled,
        padding: 10,
    },
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
    footer: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginTop: 6,
    },
})
