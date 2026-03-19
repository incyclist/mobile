import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { textSizes } from '../../../theme/textSizes';
import { EditNumberProps } from './types';

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

    useEffect(() => {
        setInternalValue(formatValue(value));
        refLastCommitted.current = value;
    }, [value, formatValue]);

    const handleCommit = useCallback(() => {
        if (internalValue === formatValue(refLastCommitted.current)) {
            return;
        }

        setError(null);

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
        onValueChange?.(numericValue);
        // Sync display to precision
        setInternalValue(formatValue(numericValue));
    }, [internalValue, allowEmpty, min, max, onValueChange, formatValue]);

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={[styles.label, { width: labelWidth }]}>{label}</Text>
                <TextInput
                    style={[
                        styles.input,
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
                <Text style={[styles.errorText, { marginLeft: labelWidth + LABEL_MARGIN }]}>
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
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
        paddingVertical: 4,
        paddingHorizontal: 4,
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