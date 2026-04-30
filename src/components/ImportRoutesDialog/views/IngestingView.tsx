import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { ButtonBar } from '../../ButtonBar';

interface IngestingViewProps {
    compact: boolean;
    current: number;
    total: number;
    currentName: string;
    errorCount: number;
    onCancel: () => void;
}

export const IngestingView = ({
    compact,
    current,
    total,
    currentName,
    errorCount,
    onCancel,
}: IngestingViewProps) => {
    const progress = total > 0 ? (current / total) * 100 : 0;
    const progressStyle = { width: `${Math.min(100, Math.max(0, progress))}%` };

    const buttons = useMemo(() => [
        { label: 'Cancel', onClick: onCancel, attention: true }
    ], [onCancel]);

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
                {`Importing ${currentName}...`}
            </Text>

            <View style={styles.progressContainer}>
                <View style={styles.track}>
                    <View style={[styles.fill, progressStyle]} />
                </View>
                <Text style={styles.progressText}>
                    {`${current} / ${total}`}
                </Text>
            </View>

            {errorCount > 0 && (
                <Text style={styles.errorText}>
                    {`Errors: ${errorCount}`}
                </Text>
            )}

            <View style={styles.buttonWrapper}>
                <ButtonBar buttons={buttons} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    containerCompact: {
        padding: 10,
    },
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: '600',
    },
    titleCompact: {
        fontSize: 18,
        marginBottom: 12,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    track: {
        width: '100%',
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    fill: {
        height: '100%',
        backgroundColor: colors.buttonPrimary,
    },
    progressText: {
        fontSize: textSizes.normalText,
        color: colors.text,
        fontWeight: '500',
    },
    errorText: {
        fontSize: textSizes.normalText,
        color: colors.error,
        marginTop: 8,
        fontWeight: 'bold',
    },
    buttonWrapper: {
        marginTop: 12,
        width: '100%',
    },
});