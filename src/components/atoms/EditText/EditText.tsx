import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { textSizes } from '../../../theme/textSizes';
import { EditTextProps } from './types';

const LABEL_MARGIN = 8;

export const EditText = ({
    label,
    value = '',
    labelWidth = 100,
    placeholder,
    disabled = false,
    validate,
    onValueChange,
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
                    placeholder={placeholder}
                    placeholderTextColor={colors.disabled}
                    editable={!disabled}
                />
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
    errorBorder: {
        borderBottomColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
});