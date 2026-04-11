import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { useLogging } from '../../hooks';
import { PasswordEditProps } from './types';

export const PasswordEdit = ({
    label,
    value = '',
    onChangeText,
    placeholder,
    disabled = false,
    hasError = false,
    compact = false,
}: PasswordEditProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const { logEvent } = useLogging('PasswordEdit');

    const handleToggle = useCallback(() => {
        const nextVisible = !isVisible;
        setIsVisible(nextVisible);
        logEvent({
            message: 'password visibility toggled',
            visible: nextVisible,
            eventSource: 'user',
        });
    }, [isVisible, logEvent]);

    const containerStyle = [styles.container, compact && styles.containerCompact];
    const inputWrapperStyle = [
        styles.inputWrapper,
        disabled && styles.disabledBorder,
        hasError && styles.errorBorder,
    ];
    const labelStyle = [styles.label, disabled && styles.disabledText];
    const inputStyle = [styles.input, disabled && styles.disabledText];
    const toggleTextStyle = [styles.toggleText, disabled && styles.disabledText];

    return (
        <View style={containerStyle}>
            <View style={styles.row}>
                {label !== undefined && (
                    <Text style={labelStyle}>{label}</Text>
                )}
                <View style={[inputWrapperStyle, styles.inputWrapperFixed]}>
                    <TextInput
                        style={inputStyle}
                        value={value ?? ''}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={colors.disabled}
                        secureTextEntry={!isVisible}
                        autoCorrect={false}
                        spellCheck={false}
                        editable={!disabled}
                        maxLength={20}
                    />
                    <TouchableOpacity
                        onPress={handleToggle}
                        style={styles.toggle}
                        disabled={disabled}
                        accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
                    >
                        <Text style={toggleTextStyle}>
                            {isVisible ? '👁️' : '👁️‍🗨️'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        width: '100%',
    },
    containerCompact: {
        marginVertical: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginRight: 8,
        width: 100,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    inputWrapperFixed: {
        maxWidth: 300,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: textSizes.normalText,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    toggle: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    errorBorder: {
        borderBottomColor: colors.error,
    },
    disabledBorder: {
        borderBottomColor: 'transparent',
    },
    disabledText: {
        color: colors.disabled,
    },
});