import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors, textSizes } from '../../theme';
import { StartNoticeInfo } from './phasedStart';

export const NOTICE_HEIGHT = 50;
export const NOTICE_HEIGHT_SHORT = 32;

export type StartNoticeProps = {
    notice: StartNoticeInfo;
    /** phones under 340 dp tall show the first line only */
    shortScreen?: boolean;
};

const NoticeGlyph = ({ notice }: { notice: StartNoticeInfo }) => {
    if (notice.tone === 'warning') return <Text style={[styles.glyph, { color: colors.statusDot.amber }]}>▲</Text>;
    if (notice.idle) return null;
    return <ActivityIndicator size="small" color={colors.text} style={styles.spinner} />;
};

/** Pinned summary of what is still outstanding; amber when something failed, neutral otherwise */
export const StartNotice = ({ notice, shortScreen = false }: StartNoticeProps) => {
    const showDetail = !!notice.detail && !shortScreen;
    const label = showDetail ? `${notice.title}. ${notice.detail}` : notice.title;
    const toneStyle = notice.tone === 'warning' ? styles.warning : styles.info;

    return (
        <View
            testID="start-notice"
            accessibilityRole="alert"
            accessibilityLabel={label}
            {...(Platform.OS === 'android' ? { accessibilityLiveRegion: 'polite' as const } : {})}
            style={[styles.container, toneStyle, { height: showDetail ? NOTICE_HEIGHT : NOTICE_HEIGHT_SHORT }]}
        >
            <View style={styles.titleRow}>
                <NoticeGlyph notice={notice} />
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail" testID="start-notice-title">{notice.title}</Text>
            </View>
            {showDetail ? (
                <Text style={styles.detail} numberOfLines={1} ellipsizeMode="tail" testID="start-notice-detail">{notice.detail}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 0,
        flexShrink: 0,
        borderLeftWidth: 3,
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 8,
        justifyContent: 'center',
    },
    warning: {
        borderLeftColor: colors.statusDot.amber,
        backgroundColor: 'rgba(245,166,35,0.14)',
    },
    info: {
        borderLeftColor: colors.disabled,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    glyph: {
        marginRight: 6,
        fontSize: textSizes.normalText,
        lineHeight: 20,
    },
    spinner: {
        marginRight: 6,
        transform: [{ scale: 0.7 }],
        width: 16,
        height: 20,
    },
    title: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    detail: {
        color: '#d3cbe0',
        fontSize: textSizes.subtitle,
        lineHeight: 18,
    },
});
