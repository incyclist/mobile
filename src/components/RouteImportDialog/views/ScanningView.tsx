import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, textSizes } from '../../../theme';

interface ScanningViewProps {
    compact: boolean;
    scannedFolders: number;
}

export const ScanningView = ({ compact, scannedFolders }: ScanningViewProps) => {
    const containerStyle = [styles.container, compact && styles.containerCompact];
    const titleStyle = [styles.title, compact && styles.titleCompact];
    const textStyle = [styles.text, compact && styles.textCompact];

    return (
        <View style={containerStyle}>
            <ActivityIndicator 
                size="large" 
                color={colors.buttonPrimary} 
                style={styles.spinner} 
            />
            <Text style={titleStyle}>
                Scanning for routes...
            </Text>
            <Text style={textStyle}>
                Folders scanned: {scannedFolders}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
    },
    containerCompact: {
        padding: 12,
        minHeight: 200,
    },
    spinner: {
        marginBottom: 24,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 8,
    },
    text: {
        fontSize: textSizes.normalText,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    textCompact: {
        fontSize: textSizes.smallText,
        marginBottom: 16,
    },
});