import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';

const CODE_LENGTH = 6;

interface CodeEntryProps {
    compact: boolean;
    onSubmit: (pin: string) => void;
}

/** Six boxes over one hidden input; submits on the sixth digit. Mount it anew to clear it. */
export const CodeEntry = ({ compact, onSubmit }: CodeEntryProps) => {
    const [value, setValue] = useState('');
    const refInput = useRef<TextInput>(null);

    const handleChange = useCallback((text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
        setValue(digits);
        if (digits.length === CODE_LENGTH) onSubmit(digits);
    }, [onSubmit]);

    const handleFocus = useCallback(() => refInput.current?.focus(), []);

    const boxStyle = compact ? styles.boxPhone : styles.boxTablet;
    const digitStyle = compact ? styles.digitPhone : styles.digitTablet;

    return (
        <TouchableWithoutFeedback onPress={handleFocus} accessible={false}>
            <View style={styles.row}>
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                    <View key={`box-${i}`} style={[styles.box, boxStyle, i === value.length && styles.boxActive]}>
                        <Text style={digitStyle}>{value[i] ?? ''}</Text>
                    </View>
                ))}
                <TextInput
                    ref={refInput}
                    style={styles.hidden}
                    value={value}
                    onChangeText={handleChange}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    autoFocus={true}
                    caretHidden={true}
                    accessibilityLabel="6-digit code"
                    textContentType="oneTimeCode"
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    box: {
        borderWidth: 1,
        borderColor: colors.dialogBorder,
        borderRadius: 6,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxActive: {
        borderColor: colors.buttonPrimary,
    },
    boxPhone: {
        width: 40,
        height: 48,
    },
    boxTablet: {
        width: 56,
        height: 64,
    },
    digitPhone: {
        color: colors.text,
        fontSize: textSizes.listEntry,
    },
    digitTablet: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
    },
    hidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
});
