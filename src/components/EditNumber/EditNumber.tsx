import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { EditNumberProps } from './types';

export const EditNumber = ({ label, labelWidth, value, onValueChange, min, max, unit, digits }: EditNumberProps) => {
    const [inputValue, setInputValue] = useState<string>(value !== undefined ? String(value) : '');

    useEffect(() => {
        setInputValue(value !== undefined ? String(value) : '');
    }, [value]);

    const handleChange = (text: string) => {
        setInputValue(text);
        const num = parseFloat(text);
        if (!isNaN(num)) {
            let clampedNum = num;
            if (min !== undefined) clampedNum = Math.max(min, clampedNum);
            if (max !== undefined) clampedNum = Math.min(max, clampedNum);
            onValueChange(clampedNum);
        } else if (text === '') {
            onValueChange(undefined); // Allow clearing the input
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { width: labelWidth }]}>{label}</Text>}
            <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={handleChange}
                keyboardType="numeric"
                placeholderTextColor={colors.disabled}
            />
            {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: colors.background,
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingHorizontal: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.text,
        textAlign: 'right',
    },
    unit: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 8,
        minWidth: 20,
    },
});