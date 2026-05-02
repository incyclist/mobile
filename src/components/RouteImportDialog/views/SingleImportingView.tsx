import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, textSizes } from '../../../theme';

interface SingleImportingViewProps {
    compact: boolean;
}

/**
 * Pure view shown when a single file is being imported after selection.
 */
export const SingleImportingView = ({ compact }: SingleImportingViewProps) => {
    const containerStyle = [styles.container, compact && styles.containerCompact];
    const titleStyle = [styles.title, compact && styles.titleCompact];

    return (
        <View style={containerStyle}>
            <ActivityIndicator
                size="large"
                color={colors.buttonPrimary}
                style={styles.spinner}
            />
            <Text style={titleStyle}>
                Importing route...
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
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: textSizes.listEntry,
    },
});