import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'
import { PairingStatusLineProps } from './types'

// the link's text stays small, but its touch area reaches 48 high through the slop, so the line
// itself doesn't grow (and push the tiles down) whenever a state has a link
const HIT_SLOP = { top: 16, bottom: 16, left: 8, right: 8 }

/**
 * The Pairing page's status line: a dot in the state's colour, the text, and the link, if the state
 * has one and there's something for it to open.
 */
export const PairingStatusLine = ({ status, variant, stateOnly = false, onLinkPress }: PairingStatusLineProps) => {
    const { logEvent } = useLogging('PairingStatusLine')

    const isShort = variant === 'short'
    const text = isShort ? status.shortText : status.text
    const link = isShort ? status.shortLink : status.link
    const showLink = !stateOnly && Boolean(link) && onLinkPress !== undefined

    const handleLinkPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'status link', status: status.id, eventSource: 'user' })
        onLinkPress?.()
    }, [logEvent, onLinkPress, status.id])

    const dotStyle = { backgroundColor: colors.statusDot[status.dot] }
    const textStyle = isShort ? styles.textShort : styles.textFull

    return (
        <View style={styles.container}>
            <View style={[styles.dot, dotStyle]} />
            <Text style={[styles.text, textStyle]}>{text}</Text>
            {showLink && (
                <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={link}
                    hitSlop={HIT_SLOP}
                    onPress={handleLinkPress}
                    style={styles.linkTouch}
                >
                    <Text style={[styles.link, textStyle]}>{link}</Text>
                </Pressable>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    text: {
        color: colors.text,
        flexShrink: 1,
        textAlign: 'center',
    },
    textShort: {
        fontSize: textSizes.smallText,
    },
    textFull: {
        fontSize: textSizes.subtitle,
    },
    linkTouch: {
        paddingVertical: 4,
        marginLeft: 6,
    },
    link: {
        color: colors.link,
        textDecorationLine: 'underline',
    },
})
