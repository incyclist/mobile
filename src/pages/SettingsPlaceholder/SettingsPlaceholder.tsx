import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogging } from '../../hooks';
import { colors, textSizes } from '../../theme';

export const SettingsPlaceholder = () => {
    const navigation = useNavigation();
    const { logEvent } = useLogging('SettingsPlaceholder');

    const handleBack = () => {
        logEvent({ message: 'button clicked', button: 'back', eventSource: 'user' });
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.message}>Not yet implemented</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        padding: 10,
    },
    backButtonText: {
        color: colors.text,
        fontSize: 40,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.pageTitle,
    },
});