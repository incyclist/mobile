import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { RouteVideoDisplayProps } from 'incyclist-services'
import { Dialog } from '../../Dialog'
import { colors } from '../../../theme'
import { getRemoveConfirmCopy, VIDEO_BUTTON_LABELS } from './videoCopy'

/**
 * "Remove download?" - freeing the space again. `Remove` is the primary button because it is the
 * action the dialog was opened for; `Keep` is the way out.
 *
 * The copy says what the user gets back and what it costs, and is careful that "remove" never
 * reads as deleting anything from iCloud Drive or removing the route from Incyclist.
 */

export interface VideoRemoveConfirmViewProps {
    removeConfirmation: NonNullable<RouteVideoDisplayProps['removeConfirmation']>
    deviceWord: string
    compact: boolean
    onConfirm: () => void
    onDismiss: () => void
}

export const VideoRemoveConfirmView = (props: VideoRemoveConfirmViewProps) => {
    const { removeConfirmation, deviceWord, compact, onConfirm, onDismiss } = props

    const copy = getRemoveConfirmCopy(removeConfirmation, { deviceWord, compact, now: 0 })

    const buttons = [
        { label: VIDEO_BUTTON_LABELS.keep, onClick: onDismiss },
        { label: VIDEO_BUTTON_LABELS.remove, primary: true, onClick: onConfirm },
    ]

    return (
        <Dialog title={copy.title} variant="info" nested={true} buttons={buttons} onOutsideClick={onDismiss}>
            <View style={styles.body}>
                {copy.body.map((line) => (
                    <Text key={line} style={styles.paragraph}>{line}</Text>
                ))}
            </View>
        </Dialog>
    )
}

const styles = StyleSheet.create({
    body: { gap: 10, paddingHorizontal: 5 },
    paragraph: { color: colors.text, fontSize: 13 },
})
