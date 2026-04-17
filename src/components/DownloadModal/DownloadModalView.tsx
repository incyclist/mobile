import React, { useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';
import { DownloadModalViewProps } from './types';
import { DownloadRowDisplayProps } from 'incyclist-services';
import { useLogging } from '../../hooks';

interface DownloadRowProps {
    row: DownloadRowDisplayProps;
    onStop: (routeId: string) => void;
    onRetry: (routeId: string) => void;
    onDelete: (routeId: string) => void;
}

const DownloadRow = memo(({ row, onStop, onRetry, onDelete }: DownloadRowProps) => {
    const {logEvent} = useLogging('RoutesDownload')
    const { routeId, title, status, pct } = row;

    const handleStop = useCallback(() => {
        logEvent( {message:'button clicked', button:'stop', routeId, eventSource:'user'  })
        onStop(routeId)
    },[logEvent, onStop, routeId]);

    const handleRetry = useCallback(() => { 
        logEvent( {message:'button clicked', button:'retry',routeId, eventSource:'user'  })
        onRetry(routeId)
    },[logEvent, onRetry, routeId]);

    const handleDelete = useCallback(() => {
        logEvent( {message:'button clicked', button:'delete',routeId,  eventSource:'user'  })
        onDelete(routeId)
    },[logEvent, onDelete, routeId]);

    const progressWidth = `${Math.min(100, Math.max(0, pct ?? 0))}%` as `${number}%`;

    return (
        <View style={styles.row}>
            <View style={styles.rowInfo}>
                <Text style={styles.routeTitle} numberOfLines={1}>
                    {title}
                </Text>
                {status === 'downloading' && (
                    <>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: progressWidth }]} />
                        </View>
                        <Text style={styles.pctText}>{pct ?? 0}%</Text>
                    </>
                )}
                {status === 'done' && (
                    <Text style={[styles.statusText, { color: colors.success }]}>
                        Saved for offline riding
                    </Text>
                )}
                {status === 'failed' && (
                    <Text style={[styles.statusText, { color: colors.error }]}>
                        Download failed
                    </Text>
                )}
                {status === 'required' && (
                    <Text style={[styles.statusText, { color: colors.warning }]}>
                        Download required to ride
                    </Text>
                )}
            </View>

            <View style={styles.rowActions}>
                {status === 'downloading' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleStop}>
                        <Text style={styles.actionButtonText}>Stop</Text>
                    </TouchableOpacity>
                )}
                {status === 'done' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                        <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                )}
                {status === 'failed' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleRetry}>
                        <Text style={styles.actionButtonText}>Retry Download</Text>
                    </TouchableOpacity>
                )}
                {status === 'required' && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleRetry}>
                        <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

export const DownloadModalView = memo(({
    visible,
    rows,
    nested,
    onStop,
    onRetry,
    onDelete,
    onClose,
}: DownloadModalViewProps) => {
    return (
        <Dialog
            title="Downloads"
            nested={nested}
            visible={visible}
            variant="details"
            onOutsideClick={onClose}
            buttons={[{ label: 'Close', onClick: onClose, primary: true }]}
        >
            <View style={styles.container}>
                {(rows??[]).length === 0 ? (
                    <View style={styles.emptyState}>
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
            </View>
        </Dialog>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
    },
    emptyState: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
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
    rowInfo: {
        flex: 1,
        marginRight: 12,
    },
    routeTitle: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusText: {
        fontSize: textSizes.smallText,
    },
    pctText: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 2,
    },
    progressContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.buttonPrimary,
    },
    rowActions: {
        minWidth: 80,
        alignItems: 'flex-end',
    },
    actionButton: {
        borderWidth: 1,
        borderColor: colors.buttonPrimary,
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    actionButtonText: {
        color: colors.buttonPrimary,
        fontSize: textSizes.smallText,
        fontWeight: '600',
    },
});
