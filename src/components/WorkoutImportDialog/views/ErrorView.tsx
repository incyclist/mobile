import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../../Icon';
import { colors, textSizes } from '../../../theme';

interface ErrorViewProps {
    compact: boolean;
    error?: string;
}

export const ErrorView = ({ compact, error }: ErrorViewProps) => (
    <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, { borderColor: colors.error }]}>
            <Icon name="funnel" size={compact ? 28 : 64} color={colors.error} />
        </View>
        <Text style={[styles.title, compact && styles.titleCompact]}>Import Failed</Text>
        <Text style={[styles.message, compact && styles.messageCompact]}>
            {error || 'An unexpected error occurred during import.'}
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
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconCircleCompact: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        marginBottom: 8,
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
    message: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    messageCompact: {
        fontSize: textSizes.smallText,
        paddingHorizontal: 10,
    },
});
