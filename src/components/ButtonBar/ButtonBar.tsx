import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import { ButtonBarProps, ButtonProps } from './types'
import { useLogging, useScreenLayout } from '../../hooks'

// Compact mode's ~34px visible button is under the 44px touch-target guideline, but its small
// footprint is intentional (saves vertical space in landscape on phones as short as ~320px tall)
// - expand the tappable region via hitSlop instead of growing the button. Horizontal slop must
// stay under btnCompact's 8px marginHorizontal (styles.btn) so adjacent buttons' hit-slop
// regions can't overlap and turn near-misses into taps on the wrong button.
const COMPACT_HIT_SLOP = { top: 5, bottom: 5, left: 6, right: 6 }

export const Button = ({ id,label, primary,attention, onClick }:ButtonProps) => {
    const {logEvent} = useLogging('Incyclist')
    const layout  = useScreenLayout()
    const isCompact = layout === 'compact'

    const onPress=()=> {
        logEvent( {message:'button clicked', button:label??id, eventSource:'user'  })
        onClick()
    }

    let bgStyle = primary ? styles.primary : styles.secondary
    if (attention) bgStyle = styles.attention

    return (
        <TouchableOpacity onPress={onPress}
            hitSlop={isCompact ? COMPACT_HIT_SLOP : undefined}
            style={[styles.btn, bgStyle, isCompact && styles.btnCompact]}>
            <Text style={[ (primary||attention) ? styles.textPrimary : styles.textSecondary, isCompact && styles.textCompact]}>
                {label}
            </Text>
        </TouchableOpacity>
    )
}


export const ButtonBar = ( {buttons}: ButtonBarProps) => {

    return (
        <View style={styles.bar}>
            {buttons.map( (props:ButtonProps) => <Button key = {props.label} {...props} />)}
            
        </View>
    )
}


const styles = StyleSheet.create({
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
