import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { EditNumberProps } from './types';
import { CHAR_WIDTH_MULTIPLIER } from '../../utils/ui'; // Import shared constant
import { useLogging } from '../../hooks';

const LABEL_MARGIN = 8;

export const EditNumber = ({
    label,
    value,
    labelWidth = 100,
    min,
    max,
    digits = 0,
    allowEmpty = false,
    unit,
    disabled = false,
    onValueChange,
    length, // Added length prop
}: EditNumberProps) => {
    const formatValue = useCallback(
        (val?: number) => {
            if (val === undefined || val === null) return '';
            return val.toFixed(digits);
        },
        [digits]
    );

    const [internalValue, setInternalValue] = useState(formatValue(value));
    const [error, setError] = useState<string | null>(null);
    const refLastCommitted = useRef(value);
    const {logEvent} = useLogging('Incyclist')

    useEffect(() => {
        setInternalValue(formatValue(value));
        refLastCommitted.current = value;
    }, [value, formatValue]);

    const handleCommit = useCallback(() => {
        setError(null);
        if (internalValue === formatValue(refLastCommitted.current)) {
            return;
        }


        if (internalValue === '') {
            if (allowEmpty) {
                refLastCommitted.current = undefined;
                onValueChange?.(undefined);
            } else {
                setInternalValue(formatValue(refLastCommitted.current));
            }
            return;
        }

        const numericValue = parseFloat(internalValue);

        if (isNaN(numericValue)) {
            // Reject non-numeric input silently (leave text for correction)
            return;
        }

        if (min !== undefined && numericValue < min) {
            setError(`Minimum value is ${min}`);
            return;
        }

        if (max !== undefined && numericValue > max) {
            setError(`Maximum value is ${max}`);
            return;
        }

        refLastCommitted.current = numericValue;

        logEvent({message:'Number edited', field:label, value:numericValue, eventSource:'user'})
        onValueChange?.(numericValue);
        // Sync display to precision
        setInternalValue(formatValue(numericValue));
    }, [internalValue, formatValue, min, max, logEvent, label, onValueChange, allowEmpty]);

    const deriveLength = useCallback((): number | undefined => {
        if (length !== undefined) return length;
        if (min === undefined && max === undefined) {
            if (value === undefined) return undefined;
            return value.toFixed(digits).length + 3;
        }
        const minStr = min !== undefined ? min.toString() : '';
        const maxStr = max !== undefined ? max.toString() : '';
        const longestLen = Math.max(minStr.length, maxStr.length);
        return longestLen + 3;
    }, [length, min, max, value, digits]);


    const labelStyle = { width: labelWidth };
    const errorStyle = { marginLeft: labelWidth + LABEL_MARGIN };

    const inputCalculatedLength = deriveLength();
    const inputWidthStyle = inputCalculatedLength !== undefined
        ? { width: inputCalculatedLength * CHAR_WIDTH_MULTIPLIER }
        : styles.inputFull; // Use flex: 1 if no length derived

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
                    keyboardType="numeric"
                    editable={!disabled}
                />
                {unit && <Text style={styles.unit}>{unit}</Text>}
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
        textAlign: 'right'
    },
    inputFull: { // Style for full width when length is not specified
        flex: 1,
    },
    disabledInput: {
        color: colors.disabled,
        borderBottomColor: 'transparent',
    },
    unit: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 8,
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