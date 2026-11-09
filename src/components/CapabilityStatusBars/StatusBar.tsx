import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { CapabilityDisplayProps } from 'incyclist-services'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'
import { BarLook, getBarLook, getBarStateLine } from './utils'

const MIN_BAR_HEIGHT = 48

interface StatusBarProps {
    tile: CapabilityDisplayProps
}

/** One required tile as a full-width bar: its title and one state line, which may wrap. A tap opens its device list, as the tile does. */
export const StatusBar = ({ tile }: StatusBarProps) => {
    const { logEvent } = useLogging('CapabilityStatusBars')

    const onPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'capability bar', capability: tile.capability, eventSource: 'user' })
        tile.onClick(tile)
    }, [logEvent, tile])

    const look: BarLook = getBarLook(tile)

    return (
        <Pressable accessibilityRole="button" onPress={onPress} style={[styles.bar, lookStyles[look]]}>
            <Text style={styles.title} numberOfLines={1}>{tile.title.toUpperCase()}</Text>
            <View style={styles.stateBox}>
                <Text style={styles.state}>{getBarStateLine(tile)}</Text>
            </View>
        </Pressable>
    )
}

const lookStyles = StyleSheet.create({
    connected: {
        backgroundColor: colors.tileActive,
    },
    waiting: {
        backgroundColor: colors.tileEmpty,
        borderColor: colors.pairingWaiting,
    },
    dimmed: {
        backgroundColor: colors.tileDimmed,
    },
    idle: {
        backgroundColor: colors.tileEmpty,
    },
})

const styles = StyleSheet.create({
    bar: {
        minHeight: MIN_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 6,
    },
    title: {
        width: 110,
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '700',
    },
    stateBox: {
        flex: 1,
    },
    state: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
})
