import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, textSizes } from '../../../theme';

interface ImportingViewProps {
    compact: boolean;
    fileName?: string;
}

export const ImportingView = ({ compact, fileName }: ImportingViewProps) => (
    <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} style={styles.spinner} />
        <Text style={[styles.title, compact && styles.titleCompact]}>
            Importing {fileName ?? 'workout'}...
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
    },
    containerCompact: {
        padding: 10,
        minHeight: 160,
    },
    spinner: {
        marginBottom: 24,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
        marginBottom: 4,
    },
});
