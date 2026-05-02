import React from 'react';
import { View, Text, StyleSheet } from 'react-max-native';
import { IngestingViewProps } from '../types';
import { colors, textSizes } from '../../../theme';

export const IngestingView = ({ progress, statusText }: IngestingViewProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.percentText}>{Math.round(progress)}%</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.buttonPrimary,
    },
    statusText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
        marginBottom: 8,
    },
    percentText: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
    },
});