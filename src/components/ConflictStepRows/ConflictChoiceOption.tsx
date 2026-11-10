import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { ConflictChoice, ConflictStepProps, TIncyclistCapability } from 'incyclist-services'

import { colors, textSizes } from '../../theme'
import { useLogging } from '../../hooks'

const MIN_ROW_HEIGHT = 48

interface ConflictChoiceOptionProps {
    capability: TIncyclistCapability
    capabilityTitle: string
    choice: ConflictChoice
    label: string
    selected: boolean
    onChoice: ConflictStepProps['onChoice']
    /** share a line's width equally with the other choice */
    fill?: boolean
}

/** One of a slot's two choices: a radio-style row at least 48 high, the same as the helper's answers. */
export const ConflictChoiceOption = ({ capability, capabilityTitle, choice, label, selected, onChoice, fill = false }: ConflictChoiceOptionProps) => {
    const { logEvent } = useLogging('ConflictStepRows')

    const onPress = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'conflict choice', capability, choice, eventSource: 'user' })
        onChoice(capability, choice)
    }, [logEvent, onChoice, capability, choice])

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${capabilityTitle}: ${label}`}
            onPress={onPress}
            style={[styles.option, fill && styles.optionFill, selected && styles.optionSelected]}
        >
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    option: {
        minHeight: MIN_ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.disabled,
    },
    // on one line with the other choice: the row's own spacing separates it from the next row
    optionFill: {
        flex: 1,
        flexBasis: 0,
        marginBottom: 0,
    },
    optionSelected: {
        borderColor: colors.pairingWaiting,
    },
    radio: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.text,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioSelected: {
        borderColor: colors.pairingWaiting,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.pairingWaiting,
    },
    label: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.subtitle,
    },
})
