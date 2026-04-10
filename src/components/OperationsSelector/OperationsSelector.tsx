import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { BinarySelect } from '../BinarySelect';
import { OperationsSelectorProps, AppsOperation } from './types';
import { useLogging } from '../../hooks';

const OPERATION_LABELS: Record<AppsOperation, string> = {
    ActivityUpload: 'Upload activities',
    WorkoutUpload: 'Upload workouts',
    WorkoutDownload: 'Download workouts',
    RouteDownload: 'Download routes',
    ActivityDownload: 'Download activities',
};

/**
 * OperationsSelector component
 *
 * Renders a list of BinarySelect toggles for various app operations.
 */
export const OperationsSelector = ({ operations = [], onChanged, compact }: OperationsSelectorProps) => {
    const { logEvent } = useLogging('OperationsSelector');

    const handleToggle = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            logEvent({
                message: 'operation toggled',
                operation,
                enabled,
                eventSource: 'user',
            });
            onChanged?.(operation, enabled);
        },
        [logEvent, onChanged]
    );

    const containerStyle = compact ? styles.compactContainer : styles.container;

    return (
        <View style={containerStyle}>
            {(operations ?? []).map((config) => (
                <View key={config.operation} style={styles.row}>
                    <BinarySelect
                        label={OPERATION_LABELS[config.operation] ?? config.operation}
                        value={config.enabled}
                        onValueChange={(val) => handleToggle(config.operation, val)}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        width: '100%',
    },
    compactContainer: {
        paddingVertical: 4,
        width: '100%',
    },
    row: {
        marginVertical: 4,
        width: '100%',
    },
});