import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, textSizes } from '../../theme';

interface ServerTextFieldProps {
    label?: string;
    value: string;
    placeholder?: string;
    error?: boolean;
    readOnly?: boolean;
    autoFocus?: boolean;
    /** fill the remaining width of a row (inline button next to the field) */
    inline?: boolean;
    onChangeText: (value: string) => void;
}

/**
 * A text field whose value follows the page service (which may rewrite it, e.g. a suggested name)
 * but keeps the typed text locally, so the cursor does not jump while the service updates.
 */
export const ServerTextField = ({
    label,
    value,
    placeholder,
    error = false,
    readOnly = false,
    autoFocus = false,
    inline = false,
    onChangeText,
}: ServerTextFieldProps) => {
    const [text, setText] = useState(value);

    useEffect(() => {
        setText(value);
    }, [value]);

    const handleChange = (next: string) => {
        setText(next);
        onChangeText(next);
    };

    return (
        <View style={inline ? styles.inline : styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError, readOnly && styles.inputReadOnly]}
                value={text}
                onChangeText={handleChange}
                placeholder={placeholder}
                placeholderTextColor={colors.disabled}
                editable={!readOnly}
                autoFocus={autoFocus}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={label ?? placeholder}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    inline: {
        flex: 1,
    },
    label: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginBottom: 4,
    },
    input: {
        minHeight: 44,
        color: colors.text,
        fontSize: textSizes.normalText,
        borderWidth: 1,
        borderColor: colors.listSeparator,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    inputError: {
        borderColor: colors.error,
        borderWidth: 2,
    },
    inputReadOnly: {
        color: colors.disabled,
    },
});
