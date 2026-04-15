import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';
import { DownloadModalViewProps, DownloadRowDisplayProps, DownloadStatus } from './types';

const getStatusColor = (status: DownloadStatus) => {
    switch (status) {
        case 'done': return colors.success;
        case 'failed': return colors.error;
        case 'required': return colors.warning;
        default: return colors.disabled;
    }
};

const getStatusText = (row: DownloadRowDisplayProps) => {
    switch (row.status) {
        case 'done': return 'Saved for offline riding';
        case 'failed': return 'Download failed';
        case 'required': return 'Download required to ride';
        case 'downloading':
            const info = [];
            if (row.sizeLabel) info.push(row.sizeLabel);
            if (row.speed) info.push(row.speed);
            return info.join('  ');
        default: return '';
    }
};

const getButtonLabel = (status: DownloadStatus) => {
    switch (status) {
        case 'downloading': return 'Stop';
        case 'done': return 'Delete';
        case 'failed': return 'Retry';
        case 'required': return 'Download';
        default: return '';
    }
};

interface DownloadRowProps {
    row: DownloadRowDisplayProps;
    onStop: (id: string) => void;
    onRetry: (id: string) => void;
    onDelete: (id: string) => void;
}

const DownloadRow = ({ row, onStop, onRetry, onDelete }: DownloadRowProps) => {
    const { routeId, status, pct } = row;

    const handleAction = useCallback(() => {
        if (status === 'downloading') {
            onStop(routeId);
        } else if (status === 'done') {
            onDelete(routeId);
        } else {
            onRetry(routeId);
        }
    }, [status, routeId, onStop, onRetry, onDelete]);

    const statusColor = getStatusColor(status);
    const statusText = getStatusText(row);
    const buttonLabel = getButtonLabel(status);

    const dynamicStatusStyle = { color: statusColor };
    const dynamicProgressFillStyle = { width: `${pct || 0}%` as const };

    return (
        <View style={styles.row}>
            <View style={styles.rowContent}>
                <Text style={styles.routeTitle} numberOfLines={1}>{row.title}</Text>
                <Text style={[styles.statusLine, dynamicStatusStyle]}>
                    {statusText}
                </Text>
                {status === 'downloading' && (
                    <View style={styles.progressRow}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, dynamicProgressFillStyle]} />
                        </View>
                        <Text style={styles.pctText}>{pct}%</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
                <Text style={styles.actionButtonText}>{buttonLabel}</Text>
            </TouchableOpacity>
        </View>
    );
};

export const DownloadModalView = ({
    visible,
    rows,
    onStop,
    onRetry,
    onDelete,
    onClose,
}: DownloadModalViewProps) => {
    const buttons = [
        { label: 'Close', onClick: onClose, type: 'secondary' as const },
    ];

    return (
        <Dialog
            title="Downloads"
            visible={visible}
            onOutsideClick={onClose}
            variant="details"
            buttons={buttons}
        >
            {rows.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No downloads</Text>
                </View>
            ) : (
                rows.map(row => (
                    <DownloadRow
                        key={row.routeId}
                        row={row}
                        onStop={onStop}
                        onRetry={onRetry}
                        onDelete={onDelete}
                    />
                ))
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.disabled,
        fontSize: textSizes.normalText,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    rowContent: {
        flex: 1,
        marginRight: 16,
    },
    routeTitle: {
        fontSize: 14,
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statusLine: {
        fontSize: textSizes.smallText,
        marginBottom: 4,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.selected,
    },
    pctText: {
        fontSize: 10,
        color: colors.text,
        width: 30,
        textAlign: 'right',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionButtonText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
});