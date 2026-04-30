import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { ButtonBar } from '../../ButtonBar';

interface ScanningViewProps {
    compact: boolean;
    scannedFolders: number;
    onCancel: () => void;
}

export const ScanningView = ({ compact, scannedFolders, onCancel }: ScanningViewProps) => {
    const buttons = [
        {
            label: 'Cancel',
            onClick: onCancel,
            primary: false,
        },
    ];

    const containerStyle = [styles.container, compact && styles.containerCompact];

    return (
        <View style={containerStyle}>
            <ActivityIndicator 
                size="large" 
                color={colors.buttonPrimary} 
                style={styles.spinner} 
            />
            <Text style={[styles.title, compact && styles.titleCompact]}>
                Scanning for routes...
            </Text>
            <Text style={[styles.text, compact && styles.textCompact]}>
                Folders scanned: {scannedFolders}
            </Text>
            <View style={styles.footer}>
                <ButtonBar buttons={buttons} />
            </View>
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
    footer: {
        width: '100%',
        marginTop: 'auto',
    },
});