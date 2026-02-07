import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'

import type {PairingButtonProps} from 'incyclist-services'

export const ButtonBar = ({ showSkip,showSimulate,showOK,primary }: PairingButtonProps) => {

    return (
        <View style={styles.bar}>
            {showSkip && <Btn label="Skip" primary={primary==='skip'} />}
            {showSimulate && <Btn label="Simulate" primary={primary==='simulate'} />}
            {showOK && <Btn label="OK" primary={primary==='ok'} />}
        </View>
    )
}

interface ButtonProps {
    label: string,
    primary?: boolean
}

const Btn = ({ label, primary }:ButtonProps) => (
    <TouchableOpacity
        style={[styles.btn, primary && styles.primary]}>
        <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
)

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
        backgroundColor: '#444',
        borderRadius: 8,
    },
    primary: {
        backgroundColor: colors.tileActive,
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
})
