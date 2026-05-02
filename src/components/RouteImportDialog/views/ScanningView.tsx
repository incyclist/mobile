import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScanningViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const ScanningView = ({ statusText }: ScanningViewProps) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.buttonPrimary} />
            <Text style={styles.statusText}>{statusText}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginTop: 20,
        textAlign: 'center',
    },
});