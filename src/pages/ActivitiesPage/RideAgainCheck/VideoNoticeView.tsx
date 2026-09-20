import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { NoticeTone, VideoNoticeContent } from './videoNoticeContent';

const TONE_COLOR: Record<NoticeTone, string> = {
    info: colors.tileIdle,
    warning: colors.warning,
    error: colors.error,
};

export interface VideoNoticeViewProps {
    notice: VideoNoticeContent;
    onKeepInsteadPress?: () => void;
}

/**
 * A left-bordered strip with an icon, a bold headline and up to a couple of lines of body text,
 * plus an optional inline "Keep it instead" link - the same shape route details uses for its own
 * video-availability notice.
 */
export const VideoNoticeView = ({ notice, onKeepInsteadPress }: VideoNoticeViewProps) => {
    const borderColor = TONE_COLOR[notice.tone];

    return (
        <View style={[styles.container, { borderLeftColor: borderColor }]}>
            <View style={styles.headlineRow}>
                <Text style={[styles.icon, { color: borderColor }]}>{notice.icon}</Text>
                <Text style={styles.headline}>{notice.headline}</Text>
            </View>
            {!!notice.body && <Text style={styles.body}>{notice.body}</Text>}
            {notice.showKeepInsteadLink && onKeepInsteadPress && (
                <TouchableOpacity onPress={onKeepInsteadPress} accessibilityLabel="Keep it instead" style={styles.linkHitArea}>
                    <Text style={styles.link}>Keep it instead</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 4,
        marginBottom: 12,
    },
    headlineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    icon: {
        fontSize: textSizes.normalText,
        lineHeight: textSizes.normalText + 4,
    },
    headline: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    body: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
    linkHitArea: {
        minHeight: 44,
        justifyContent: 'center',
    },
    link: {
        color: colors.tileIdle,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
});
