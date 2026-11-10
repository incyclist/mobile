import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { PairingSidePanelProps } from './types'

const MIN_TOUCH_SIZE = 48

/**
 * The non-modal panel beside the tiles on the Pairing page: a header with the title and a close
 * button, the body, and an optional area pinned at the bottom. It holds the "can't find your
 * trainer" helper.
 */
export const PairingSidePanel = ({ title, subline, onClose, children, pinned }: PairingSidePanelProps) => (
    <View style={styles.panel}>
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <Text style={styles.title} accessibilityRole="header">{title}</Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={onClose}
                    style={styles.close}
                >
                    <Text style={styles.closeText}>✕</Text>
                </Pressable>
            </View>
            {subline ? <Text style={styles.subline}>{subline}</Text> : null}
        </View>

        {children}

        {pinned ? (
            <View testID="pairing-side-panel-pinned" style={styles.pinned}>
                {pinned}
            </View>
        ) : null}
    </View>
)

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
    pinned: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.disabled,
        padding: 10,
    },
})
