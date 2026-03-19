import React from 'react';
import { TextInput, View, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { EditTextProps } from './types';

export const EditText = ({ label, labelWidth, value, onValueChange, length }: EditTextProps) => {
    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { width: labelWidth }]}>{label}</Text>}
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onValueChange}
                maxLength={length}
                placeholderTextColor={colors.disabled}
                keyboardType="default"
            />
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
    },
});