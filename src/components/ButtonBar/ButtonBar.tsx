import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import { ButtonBarProps, ButtonProps } from './types'
import { useLogging, useScreenLayout } from '../../hooks'

export const Button = ({ id,label, primary,attention, onClick }:ButtonProps) => {
    const {logEvent} = useLogging('Incyclist')
    const layout  = useScreenLayout()        
    const isCompact = layout === 'compact'
    
    const onPress=()=> {
        logEvent( {message:'button clicked', button:label??id  })
        onClick()
    }

    let bgStyle = primary ? styles.primary : styles.secondary
    if (attention) bgStyle = styles.attention

    return (
        <TouchableOpacity onPress={onPress}
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
