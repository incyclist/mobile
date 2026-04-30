import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textSizes } from '../../../theme';
import { ButtonBar } from '../../ButtonBar';
import { Icon } from '../../Icon';
import type { FailedRoute } from 'incyclist-services';

interface CompleteViewProps {
    compact: boolean;
    imported: number;
    skipped: number;
    errors: number;
    failedRoutes: FailedRoute[];
    onDone: () => void;
}

const SummaryItem = ({ label, count, color = colors.text }: { label: string; count: number; color?: string }) => (
    <View style={styles.summaryItem}>
        <Text style={[styles.summaryCount, { color }]}>{count}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
    </View>
);

export const CompleteView = ({
    compact,
    imported,
    skipped,
    errors,
    failedRoutes,
    onDone,
}: CompleteViewProps) => {
    const [showErrors, setShowErrors] = useState(false);

    const toggleErrors = useCallback(() => {
        setShowErrors(prev => !prev);
    }, []);

    const buttons = useMemo(() => [
        { label: 'Done', onClick: onDone, primary: true }
    ], [onDone]);

    const toggleStyle = useMemo(() => ({
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: 12,
    }), []);

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
                Import Complete
            </Text>

            <View style={styles.summaryRow}>
                <SummaryItem label="Imported" count={imported} />
                <SummaryItem label="Skipped" count={skipped} />
                <SummaryItem label="Errors" count={errors} color={errors > 0 ? colors.error : colors.text} />
            </View>

            {errors > 0 && (
                <View style={styles.errorSection}>
                    <TouchableOpacity onPress={toggleErrors} style={toggleStyle}>
                        <Text style={styles.toggleText}>Show Errors</Text>
                        <Icon name={showErrors ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
                    </TouchableOpacity>
                    
                    {showErrors && (
                        <View style={styles.errorList}>
                            {failedRoutes.map((route, index) => (
                                <View key={`${route.name}-${index}`} style={styles.errorItem}>
                                    <Text style={styles.errorRouteName}>{route.name}</Text>
                                    <Text style={styles.errorReason}>{route.reason}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <Text style={styles.note}>
                Note: Videos are referenced in place and not copied.
            </Text>

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
        marginBottom: 20,
        fontWeight: 'bold',
    },
    titleCompact: {
        fontSize: 20,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 16,
        borderRadius: 8,
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryCount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    errorSection: {
        width: '100%',
        marginBottom: 16,
    },
    toggleText: {
        fontSize: textSizes.normalText,
        color: colors.text,
        marginRight: 8,
        fontWeight: '500',
    },
    errorList: {
        width: '100%',
        maxHeight: 200,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        borderRadius: 8,
        padding: 8,
    },
    errorItem: {
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 4,
    },
    errorRouteName: {
        fontSize: 14,
        color: colors.error,
        fontWeight: '600',
    },
    errorReason: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.8,
    },
    note: {
        fontSize: textSizes.smallText,
        color: colors.text,
        opacity: 0.6,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    buttonWrapper: {
        width: '100%',
    },
});