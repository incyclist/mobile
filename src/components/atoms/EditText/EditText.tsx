import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { textSizes } from '../../../theme/textSizes';
import { EditTextProps } from './types';
import { CHAR_WIDTH_MULTIPLIER } from '../../../utils/ui'; // Import shared constant

const LABEL_MARGIN = 8;

export const EditText = ({
    label,
    value = '',
    labelWidth = 100,
    placeholder,
    disabled = false,
    validate,
    onValueChange,
    length, // Added length prop
}: EditTextProps) => {
    const [internalValue, setInternalValue] = useState(value);
    const [error, setError] = useState<string | null>(null);
    const refLastValue = useRef(value);

    useEffect(() => {
        setInternalValue(value);
        refLastValue.current = value;
    }, [value]);

    const handleCommit = useCallback(() => {
        if (internalValue === refLastValue.current) {
            return;
        }

        setError(null);
        if (validate) {
            const validationError = validate(internalValue);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        refLastValue.current = internalValue;
        onValueChange?.(internalValue);
    }, [internalValue, validate, onValueChange]);

    const labelStyle = { width: labelWidth };
    const errorStyle = { marginLeft: labelWidth + LABEL_MARGIN };

    // Determine input width based on length prop or flex: 1
    const inputWidthStyle = length !== undefined
        ? { width: length * CHAR_WIDTH_MULTIPLIER }
        : styles.inputFull; // Use flex: 1 if no length specified

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={[styles.label, labelStyle]}>{label}</Text>
                <TextInput
                    style={[
                        styles.input,
                        inputWidthStyle, // Apply dynamic width here
                        disabled && styles.disabledInput,
                        error !== null && styles.errorBorder,
                    ]}
                    value={internalValue}
                    onChangeText={setInternalValue}
                    onBlur={handleCommit}
                    onEndEditing={handleCommit}
                    placeholder={placeholder}
                    placeholderTextColor={colors.disabled}
                    editable={!disabled}
                />
            </View>
            {error && (
                <Text style={[styles.errorText, errorStyle]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: LABEL_MARGIN,
    },
    input: {
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    inputFull: { // Style for full width when length is not specified
        flex: 1,
    },
    disabledInput: {
        color: colors.disabled,
        borderBottomColor: 'transparent',
    },
    errorBorder: {
        borderBottomColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
});