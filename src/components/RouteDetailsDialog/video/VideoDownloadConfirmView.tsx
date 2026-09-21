import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { RouteVideoDisplayProps, VideoKeepChoice } from 'incyclist-services'
import { Dialog } from '../../Dialog'
import { colors } from '../../../theme'
import { DownloadConfirmCopy, getDownloadConfirmCopy, VIDEO_BUTTON_LABELS } from './videoCopy'
import { inertWhenDisabled } from './videoButtons'

/**
 * "Download this video?" - the one place the keep-or-remove decision is made, asked at the moment
 * it means something: a download that is about to start.
 *
 * The two download buttons are disabled together, from the page service's `downloadEnabled` flag
 * alone. Free space can change between this dialog rendering and the tap, and only the service
 * re-checks it; this view never compares sizes itself.
 */

export interface VideoDownloadConfirmViewProps {
    confirmation: NonNullable<RouteVideoDisplayProps['confirmation']>
    /** False disables both download buttons and replaces the facts with the reason. */
    downloadEnabled: boolean
    deviceWord: string
    compact: boolean
    onConfirm: (choice: VideoKeepChoice) => void
    onDismiss: () => void
}

const FactRows = ({ facts }: { facts: Array<{ label: string, value: string }> }) => (
    <View style={styles.facts}>
        {facts.map((fact) => (
            <View key={fact.label} style={styles.factRow}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
            </View>
        ))}
    </View>
)

/** The blocked reason takes over the facts entirely; otherwise it's the compact one-liner or the full rows. */
const FactsOrBlocked = ({ copy, compact }: { copy: DownloadConfirmCopy, compact: boolean }) => {
    if (copy.blocked)
        return <Text style={styles.blocked}>{copy.blocked}</Text>
    if (compact)
        return <Text style={styles.paragraph}>{copy.factsLine}</Text>
    return <FactRows facts={copy.facts} />
}

export const VideoDownloadConfirmView = (props: VideoDownloadConfirmViewProps) => {
    const { confirmation, downloadEnabled, deviceWord, compact, onConfirm, onDismiss } = props

    const copy = getDownloadConfirmCopy(
        confirmation,
        { deviceWord, compact, now: 0 },
        { blocked: !downloadEnabled }
    )

    const blocked = !downloadEnabled

    const buttons = [
        { label: VIDEO_BUTTON_LABELS.notNow, onClick: onDismiss },
        {
            label: VIDEO_BUTTON_LABELS.downloadThisRide,
            disabled: blocked,
            onClick: inertWhenDisabled(blocked, () => onConfirm('this-ride')),
        },
        {
            label: VIDEO_BUTTON_LABELS.downloadAndKeep,
            primary: true,
            disabled: blocked,
            onClick: inertWhenDisabled(blocked, () => onConfirm('keep')),
        },
    ]

    return (
        <Dialog title={copy.title} variant="info" nested={true} buttons={buttons} onOutsideClick={onDismiss}>
            <View style={styles.body}>
                <Text style={styles.paragraph}>{copy.intro}</Text>

                <FactsOrBlocked copy={copy} compact={compact} />

                {!!copy.offline && <Text style={styles.paragraph}>{copy.offline}</Text>}

                <Text style={styles.paragraph}>{copy.background}</Text>

                {copy.choice.map((line) => (
                    <Text key={line} style={styles.choice}>{compact ? line : `• ${line}`}</Text>
                ))}
            </View>
        </Dialog>
    )
}

const styles = StyleSheet.create({
    body: { gap: 10, paddingHorizontal: 5 },
    paragraph: { color: colors.text, fontSize: 13 },
    choice: { color: colors.text, fontSize: 13, opacity: 0.85 },
    facts: { gap: 4 },
    factRow: { flexDirection: 'row', gap: 10 },
    factLabel: { color: colors.disabled, fontSize: 13, width: 90 },
    factValue: { color: colors.text, fontSize: 13, flexShrink: 1 },
    blocked: { color: colors.warning, fontSize: 13 },
})
