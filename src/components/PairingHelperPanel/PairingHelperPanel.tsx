import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'
import { PairingSidePanel, PairingSidePanelAction } from '../PairingSidePanel'
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
    const action = resolved ? undefined : helper.action
    const showPinned = action !== undefined || showFooterLine

    const pinned = showPinned ? (
        <>
            {action ? <PairingSidePanelAction label={action.label} note={action.note} onPress={onAction} /> : null}
            {showFooterLine ? <Text style={styles.footer}>{helper.footer}</Text> : null}
        </>
    ) : undefined

    return (
        <PairingSidePanel
            title={helper.title}
            subline={resolved ? undefined : helper.subline}
            onClose={onClose}
            pinned={pinned}
        >
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
        </PairingSidePanel>
    )
}

const styles = StyleSheet.create({
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
    footer: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginTop: 6,
    },
})
