import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import { ButtonBarProps, ButtonProps } from './types'
import { useLogging } from '../../hooks'

const Btn = ({ id,label, primary,onClick }:ButtonProps) => {
    const {logEvent} = useLogging('Incyclist')

    const onPress=()=> {
        logEvent( {message:'button clicked', button:label??id  })
        onClick()
    }

    return (
    <TouchableOpacity onPress={onPress}
        style={[styles.btn, primary ? styles.primary : styles.secondary]}>
        <Text style={primary ? styles.textPrimary : styles.textSecondary}>{label}</Text>
    </TouchableOpacity>
    )
}


export const ButtonBar = ( {buttons}: ButtonBarProps) => {

    return (
        <View style={styles.bar}>
            {buttons.map( (props:ButtonProps) => <Btn key = {props.label} {...props} />)}
            
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

})
