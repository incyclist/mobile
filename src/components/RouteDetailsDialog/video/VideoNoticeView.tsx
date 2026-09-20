import React, { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { RouteVideoDisplayProps } from 'incyclist-services'
import { colors } from '../../../theme'
import {
    ACCESS_CONFIRMED_ANNOUNCEMENT, getAccessConfirmedLine, getVideoNotice,
    LINK_LABELS, VideoNotice, VideoNoticeLink, VideoNoticeTone,
} from './videoCopy'

/**
 * The strip that explains what is happening with a route's video file, and - where there is
 * something to undo - carries the single inline link that changes it.
 *
 * Pure: everything it shows comes from the props, and the only things it decides for itself are
 * when a short-lived notice has applied long enough to be worth showing, and whether to announce
 * a transition to a screen reader. Which actions exist is not its call - the caller passes the
 * handlers it wants offered, and a link with no handler is simply not rendered.
 */

export interface VideoNoticeViewProps {
    video: RouteVideoDisplayProps
    /** "iPad" or "iPhone", as the user's own device is named in the Files app. */
    deviceWord: string
    compact: boolean
    /** Injectable clock, so the elapsed line is deterministic in tests and stories. */
    now?: number
    /** Offered only when the page service says the keep-instead action applies. */
    onKeepInstead?: () => void
    /** Offered only when the page service says the remove action applies. */
    onRemoveDownload?: () => void
}

const TONE_COLORS: Record<VideoNoticeTone, string> = {
    info: colors.tileIdle,
    warning: colors.warning,
    error: colors.error,
}

/**
 * True once `delayMs` has passed since `key` last changed; immediately true when there is none.
 * The key identifies the message being waited on, so a different message restarts the wait.
 */
const useSettled = (key: string, delayMs?: number): boolean => {
    const [settled, setSettled] = useState(!delayMs)

    useEffect(() => {
        if (!delayMs) {
            setSettled(true)
            return
        }
        setSettled(false)
        const timer = setTimeout(() => setSettled(true), delayMs)
        return () => clearTimeout(timer)
    }, [key, delayMs])

    return settled
}

/** Speaks a transition the user did not trigger, once per distinct message. */
const useAnnouncement = (message?: string | null) => {
    const refLast = useRef<string | null>(null)

    useEffect(() => {
        if (!message || refLast.current === message)
            return
        refLast.current = message
        AccessibilityInfo?.announceForAccessibility?.(message)
    }, [message])
}

const NoticeLink = ({ link, onPress }: { link: VideoNoticeLink, onPress: () => void }) => (
    <TouchableOpacity
        style={styles.link}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={LINK_LABELS[link]}
    >
        <Text style={styles.linkText}>{LINK_LABELS[link]}</Text>
    </TouchableOpacity>
)

const AccessConfirmedLine = ({ text }: { text: string }) => (
    <View style={[styles.notice, styles.confirmed]}>
        <Text style={styles.confirmedText}>{text}</Text>
    </View>
)

type NoticeBodyProps = {
    notice: VideoNotice
    linkHandler?: () => void
}

const NoticeBody = ({ notice, linkHandler }: NoticeBodyProps) => {
    // The link belongs to the last line that exists, so it never floats on its own row above the
    // sentence it undoes.
    const linkOnExtra = !!notice.extra
    return (
        <>
            {!!notice.body && (
                <View style={styles.line}>
                    <Text style={styles.bodyText}>{notice.body}</Text>
                    {!linkOnExtra && !!notice.link && !!linkHandler && (
                        <NoticeLink link={notice.link} onPress={linkHandler} />
                    )}
                </View>
            )}
            {!!notice.extra && (
                <View style={styles.line}>
                    <Text style={styles.bodyText}>{notice.extra}</Text>
                    {!!notice.link && !!linkHandler && (
                        <NoticeLink link={notice.link} onPress={linkHandler} />
                    )}
                </View>
            )}
        </>
    )
}

const LINK_HANDLERS = (props: VideoNoticeViewProps): Record<VideoNoticeLink, (() => void) | undefined> => ({
    // Both are gated on the page service's own action flags, never on the state the copy came
    // from - the service is the only thing that knows whether an action currently applies.
    'keep-instead': props.video.actions.keepInstead ? props.onKeepInstead : undefined,
    'remove-download': props.video.actions.remove ? props.onRemoveDownload : undefined,
})

export const VideoNoticeView = (props: VideoNoticeViewProps) => {
    const { video, deviceWord, compact, now } = props

    const ctx = { deviceWord, compact, now: now ?? Date.now() }
    const notice = getVideoNotice(video, ctx)
    const confirmedLine = getAccessConfirmedLine(video)

    const settled = useSettled(notice?.headline ?? '', notice?.delayMs)
    useAnnouncement(confirmedLine ? ACCESS_CONFIRMED_ANNOUNCEMENT : notice?.announce)

    const showNotice = !!notice && settled
    if (!showNotice && !confirmedLine)
        return null

    const linkHandler = notice?.link ? LINK_HANDLERS(props)[notice.link] : undefined

    return (
        <View style={styles.root}>
            {!!confirmedLine && <AccessConfirmedLine text={confirmedLine} />}
            {showNotice && (
                <View
                    style={[styles.notice, { borderLeftColor: TONE_COLORS[notice.tone] }]}
                    accessibilityRole="alert"
                >
                    <View style={styles.headlineRow}>
                        {notice.spinner
                            ? <ActivityIndicator size="small" color={TONE_COLORS[notice.tone]} accessibilityLabel="Downloading" />
                            : <Text style={[styles.icon, { color: TONE_COLORS[notice.tone] }]}>{notice.icon}</Text>}
                        <Text style={styles.headline}>{notice.headline}</Text>
                    </View>
                    <NoticeBody notice={notice} linkHandler={linkHandler} />
                </View>
            )}
        </View>
    )
}

// The 44pt floor applies to the inline links too - they are the only way to change a keep-or-
// remove decision from this screen, so they get a real target rather than tappable text.
const MIN_TOUCH_TARGET = 44

const styles = StyleSheet.create({
    root: { paddingHorizontal: 15, paddingVertical: 6, gap: 6 },
    notice: {
        borderLeftWidth: 3,
        paddingLeft: 10,
        paddingVertical: 4,
        gap: 2,
    },
    confirmed: { borderLeftColor: colors.success },
    confirmedText: { color: colors.success, fontSize: 13 },
    headlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    icon: { fontSize: 14 },
    headline: { color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1 },
    line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    bodyText: { color: colors.text, fontSize: 12, opacity: 0.85, flexShrink: 1 },
    link: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, justifyContent: 'center' },
    linkText: { color: colors.tileIdle, fontSize: 12, textDecorationLine: 'underline' },
})
