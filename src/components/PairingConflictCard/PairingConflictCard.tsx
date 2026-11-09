import React, { useCallback } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import { useLogging } from '../../hooks'
import { PairingSidePanel, PairingSidePanelAction } from '../PairingSidePanel'
import { ConflictStepRows } from '../ConflictStepRows'
import { PairingConflictCardProps } from './types'

const DONE_LABEL = 'Done'

/**
 * A device found by the search wants slots that already hold a different device: the rider picks,
 * per slot, which device to keep. Shown in the panel beside the tiles, non-modal, so the page's own
 * buttons stay usable. ✕ keeps every current device; Done applies the choices.
 */
export const PairingConflictCard = ({ conflict, layout }: PairingConflictCardProps) => {
    const { logEvent } = useLogging('PairingConflictCard')

    const onClose = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'conflict close', eventSource: 'user' })
        conflict.onDismiss()
    }, [conflict, logEvent])

    const onDone = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'conflict done', eventSource: 'user' })
        conflict.onDone()
    }, [conflict, logEvent])

    const subline = layout === 'phone' ? conflict.subline.short : conflict.subline.full
    const titleNote = conflict.queued > 0 ? conflict.queuedText : undefined

    return (
        <PairingSidePanel
            title={conflict.title}
            titleNote={titleNote}
            subline={subline}
            onClose={onClose}
            pinned={<PairingSidePanelAction label={DONE_LABEL} onPress={onDone} />}
        >
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                <ConflictStepRows rows={conflict.rows} onChoice={conflict.onChoice} />
            </ScrollView>
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
})
