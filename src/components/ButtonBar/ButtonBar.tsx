import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import { ButtonBarProps, ButtonProps } from './types'

const Btn = ({ label, primary,onClick }:ButtonProps) => (
    <TouchableOpacity onPress={onClick}
        style={[styles.btn, primary ? styles.primary : styles.secondary]}>
        <Text style={primary ? styles.textPrimary : styles.textSecondary}>{label}</Text>
    </TouchableOpacity>
)


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
