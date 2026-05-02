import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Icon } from '../../Icon';
import { ResultViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const ResultView = ({ success, message, errorDetails }: ResultViewProps) => {
    return (
        <View style={styles.container}>
            <Icon 
                name={success ? 'plus' : 'funnel'} 
                size={48} 
                color={success ? colors.buttonPrimary : colors.error} 
            />
            <Text style={styles.title}>{success ? 'Success' : 'Import Error'}</Text>
            <Text style={styles.message}>{message}</Text>
            
            {errorDetails && (
                <ScrollView style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorDetails}</Text>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.dialogTitle,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
        marginBottom: 16,
    },
    errorContainer: {
        width: '100%',
        maxHeight: 150,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        color: colors.error,
        fontSize: textSizes.smallText,
        fontFamily: 'monospace',
    },
});