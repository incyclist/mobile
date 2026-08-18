import React, { useRef } from 'react'
import { View, TouchableOpacity, Text, StyleSheet, LayoutChangeEvent } from 'react-native'
import { colors } from '../../theme'
import { ButtonBarProps, ButtonProps } from './types'
import { useLogging, useScreenLayout } from '../../hooks'

/**
 * FIXES_BACKLOG #52 - the bar always renders this many slots, even when fewer buttons are
 * passed. On iOS, React Native's new architecture does not lay out a view that is mounted into
 * an already-presented <Modal> subtree, so a button added after the dialog opened stayed
 * invisible until some later change forced a layout pass. Keeping every slot mounted from the
 * first render means a changing button set only ever updates props on existing views - the path
 * that demonstrably works (text in the same dialog repaints correctly, including width changes).
 *
 * Raise this if any dialog ever needs more buttons; a bar passed more than MAX_SLOTS still
 * renders all of them, it just loses the guarantee for the ones beyond the initial count.
 */
const MAX_SLOTS = 3

type SlotProps = ButtonProps & {
    hidden?: boolean
    slotIndex?: number
    debugLayout?: boolean
}

export const Button = ({ id, label, primary, attention, onClick, hidden, slotIndex, debugLayout }: SlotProps) => {
    const { logEvent } = useLogging('Incyclist')
    const layout = useScreenLayout()
    const isCompact = layout === 'compact'
    const refLastLogged = useRef<string>('')

    const onPress = () => {
        if (hidden) return
        logEvent({ message: 'button clicked', button: label ?? id, eventSource: 'user' })
        onClick()
    }

    // Diagnostic only, and only where explicitly enabled: reports whether a slot that became
    // visible after the dialog opened actually received a layout, and at what size. A missing
    // event, or width 0, means the view was mounted but never laid out.
    const onLayout = debugLayout
        ? (e: LayoutChangeEvent) => {
            const { x, y, width, height } = e.nativeEvent.layout
            const signature = `${label}|${hidden}|${width}x${height}`
            if (refLastLogged.current === signature) return
            refLastLogged.current = signature
            logEvent({ message: 'button layout', slot: slotIndex, button: label ?? id, hidden: !!hidden, x, y, width, height })
        }
        : undefined

    let bgStyle = primary ? styles.primary : styles.secondary
    if (attention) bgStyle = styles.attention

    return (
        <TouchableOpacity onPress={onPress}
            onLayout={onLayout}
            accessible={!hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
            style={[styles.btn, bgStyle, isCompact && styles.btnCompact, hidden && styles.hidden]}>
            <Text style={[(primary || attention) ? styles.textPrimary : styles.textSecondary, isCompact && styles.textCompact]}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}

export const ButtonBar = ({ buttons, debugLayout }: ButtonBarProps) => {

    const slotCount = Math.max(MAX_SLOTS, buttons.length)

    return (
        <View style={styles.bar}>
            {Array.from({ length: slotCount }, (_, i) => {
                const button = buttons[i]
                // Positional keys, deliberately: keying on the label would remount a slot whenever
                // the button set changed, which is the very thing this component avoids.
                return (
                    <Button
                        key={`slot-${i}`}
                        slotIndex={i}
                        debugLayout={debugLayout}
                        hidden={!button}
                        label={button?.label ?? ''}
                        id={button?.id}
                        primary={button?.primary}
                        attention={button?.attention}
                        onClick={button?.onClick ?? (() => { })}
                    />
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    hidden: {
        display: 'none',
    },
    bar: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 12,
    },
    btn: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        marginHorizontal: 8,
        borderRadius: 8,
    },
    primary: {
        backgroundColor: colors.buttonPrimary,
    },
    attention: {
        color: '#fff',
        backgroundColor: colors.error,
    },
    secondary: {
        borderWidth:2,
        backgroundColor: colors.buttonSecondary,
        borderColor: colors.buttonPrimary,
    },
    textPrimary: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    textSecondary: {
        color: colors.buttonPrimary,
        fontSize: 18,
        fontWeight: '700',
    },

    textCompact: {
       fontSize: 14,
    },
    btnCompact: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },

})
