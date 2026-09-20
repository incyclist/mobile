import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { RouteVideoDisplayProps } from 'incyclist-services'
import { colors } from '../../../theme'
import { getVideoFileRow, getVideoStat, LINK_LABELS } from './videoCopy'

/**
 * The two small surfaces that carry the video's state without costing the layout any height:
 * a fourth box in the tablet stats row, and the bottom "Video file" row on the phone column.
 *
 * Both can end in a `Remove download` link, and both render it only when the caller passes a
 * handler - which it does only when the page service offers that action.
 */

interface RemoveLinkProps {
    onPress?: () => void
}

const RemoveLink = ({ onPress }: RemoveLinkProps) => {
    if (!onPress)
        return null
    return (
        <TouchableOpacity
            style={styles.link}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={LINK_LABELS['remove-download']}
        >
            <Text style={styles.linkText}>{LINK_LABELS['remove-download']}</Text>
        </TouchableOpacity>
    )
}

export interface VideoStatBoxProps {
    video: RouteVideoDisplayProps
    /** Passed only when `actions.remove` applies; absent leaves the link out entirely. */
    onRemoveDownload?: () => void
}

/** Tablet only. Returns null for states the notice strip below the row already explains. */
export const VideoStatBox = ({ video, onRemoveDownload }: VideoStatBoxProps) => {
    const stat = getVideoStat(video)
    if (!stat)
        return null

    return (
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>Video</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <View style={styles.subRow}>
                {!!stat.sub && <Text style={styles.statSub}>{stat.sub}</Text>}
                {stat.link === 'remove-download' && <RemoveLink onPress={onRemoveDownload} />}
            </View>
        </View>
    )
}

export interface VideoFileRowViewProps extends VideoStatBoxProps {
    deviceWord: string
}

/** Phone only. Sits at the bottom of the form column, for a video that is on the device. */
export const VideoFileRowView = ({ video, deviceWord, onRemoveDownload }: VideoFileRowViewProps) => {
    const row = getVideoFileRow(video, { deviceWord, compact: true, now: 0 })
    if (!row)
        return null

    return (
        <View style={styles.fileRow}>
            <Text style={styles.fileRowText}>{row.text}</Text>
            {row.link === 'remove-download' && <RemoveLink onPress={onRemoveDownload} />}
        </View>
    )
}

const MIN_TOUCH_TARGET = 44

const styles = StyleSheet.create({
    // Matches the Distance/Elevation/Type boxes beside it, so the row stays four even columns.
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { color: colors.disabled, fontSize: 10, textTransform: 'uppercase' },
    statValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
    subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    statSub: { color: colors.disabled, fontSize: 11, marginTop: 2 },
    fileRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    fileRowText: { color: colors.disabled, fontSize: 12, flexShrink: 1 },
    link: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' },
    linkText: { color: colors.tileIdle, fontSize: 12, textDecorationLine: 'underline' },
})
