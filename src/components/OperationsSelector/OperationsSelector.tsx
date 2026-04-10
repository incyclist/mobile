import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppsOperation } from 'incyclist-services';
import { BinarySelect } from '../BinarySelect';
import { OperationsSelectorProps } from './types';
import { useLogging } from '../../hooks/useLogging';

const OPERATION_LABELS: Record<string, string> = {
    ActivityUpload: 'Upload activities',
    WorkoutUpload: 'Upload workouts',
    WorkoutDownload: 'Download workouts',
    RouteDownload: 'Download routes',
    ActivityDownload: 'Download activities',
};

/**
 * OperationRow sub-component to handle memoized callbacks for each row
 */
const OperationRow = ({
    operation,
    enabled,
    onToggle,
}: {
    operation: AppsOperation;
    enabled: boolean;
    onToggle: (op: AppsOperation, val: boolean) => void;
}) => {
    const handleValueChange = useCallback(
        (val: boolean) => {
            onToggle(operation, val);
        },
        [operation, onToggle]
    );

    const label = OPERATION_LABELS[operation as string] || (operation as string);

    return (
        <View style={styles.row}>
            <BinarySelect label={label} value={enabled} onValueChange={handleValueChange} />
        </View>
    );
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
            {operations.map((config) => (
                <OperationRow
                    key={config.operation}
                    operation={config.operation}
                    enabled={config.enabled}
                    onToggle={handleToggle}
                />
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