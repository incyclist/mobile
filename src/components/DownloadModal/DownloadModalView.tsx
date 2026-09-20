import React, { useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';
import { DownloadModalViewProps } from './types';
import { DownloadRowDisplayProps } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { getICloudRowText, RowTone } from './icloudRowText';

interface DownloadRowProps {
    row: DownloadRowDisplayProps;
    compact: boolean;
    onStop: (routeId: string) => void;
    onRetry: (routeId: string) => void;
    onDelete: (routeId: string) => void;
    onKeepInstead: (routeId: string) => void;
}

const TONE_COLOR: Record<RowTone, string> = {
    info: colors.tileIdle,
    warning: colors.warning,
    success: colors.success,
    error: colors.error,
};

// Server-hosted downloads (the existing, non-iCloud case). This renders exactly as it always
// has - status drives the text and the single action button, nothing else may change it.
const ServerDownloadRow = memo(({ row, onStop, onRetry, onDelete }: Omit<DownloadRowProps, 'compact' | 'onKeepInstead'>) => {
    const { logEvent } = useLogging('RoutesDownload');
    const { routeId, title, status, pct } = row;

    const handleStop = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'stop', routeId, eventSource: 'user' });
        onStop(routeId);
    }, [logEvent, onStop, routeId]);

    const handleRetry = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'retry', routeId, eventSource: 'user' });
        onRetry(routeId);
    }, [logEvent, onRetry, routeId]);

    const handleDelete = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'delete', routeId, eventSource: 'user' });
        onDelete(routeId);
    }, [logEvent, onDelete, routeId]);

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

const ICloudRowAction = ({ row, onStop, onRetry, onKeepInstead }: Omit<DownloadRowProps, 'compact' | 'onDelete'>) => {
    const { logEvent } = useLogging('RoutesDownload');
    const { routeId, actions } = row;

    const handleStop = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'stop', routeId, eventSource: 'user' });
        onStop(routeId);
    }, [logEvent, onStop, routeId]);

    const handleRetry = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'retry', routeId, eventSource: 'user' });
        onRetry(routeId);
    }, [logEvent, onRetry, routeId]);

    const handleKeepInstead = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'keep-instead', routeId, eventSource: 'user' });
        onKeepInstead(routeId);
    }, [logEvent, onKeepInstead, routeId]);

    if (actions?.stop)
        return (
            <TouchableOpacity style={styles.actionButton} onPress={handleStop}>
                <Text style={styles.actionButtonText}>Stop</Text>
            </TouchableOpacity>
        );
    if (actions?.retry)
        return (
            <TouchableOpacity style={styles.actionButton} onPress={handleRetry}>
                <Text style={styles.actionButtonText}>Retry Download</Text>
            </TouchableOpacity>
        );
    if (actions?.download)
        return (
            <TouchableOpacity style={styles.actionButton} onPress={handleRetry}>
                <Text style={styles.actionButtonText}>Download</Text>
            </TouchableOpacity>
        );
    if (actions?.keepInstead)
        return (
            <TouchableOpacity style={styles.actionButton} onPress={handleKeepInstead}>
                <Text style={styles.actionButtonText}>Keep it instead</Text>
            </TouchableOpacity>
        );

    return null;
};

// iCloud downloads this app started. No Delete here, deliberately: for a server download,
// "Delete" removes the local copy, but for an iCloud video that same word would read as deleting
// it from iCloud. Removing an iCloud video is only ever the explicit "Remove download" action in
// route details, so this component never renders a Delete button for one.
const ICloudDownloadRow = memo(({ row, compact, onStop, onRetry, onKeepInstead }: DownloadRowProps) => {
    const { title } = row;
    const { text, tone } = getICloudRowText(row, compact);

    return (
        <View style={styles.row}>
            <View style={styles.rowInfo}>
                <Text style={styles.routeTitle} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.icloudStatusRow}>
                    {row.status === 'downloading' && (
                        <ActivityIndicator size="small" color={TONE_COLOR.info} style={styles.icloudSpinner} />
                    )}
                    <Text style={[styles.statusText, { color: TONE_COLOR[tone] }]}>{text}</Text>
                </View>
            </View>

            <View style={styles.rowActions}>
                <ICloudRowAction row={row} onStop={onStop} onRetry={onRetry} onKeepInstead={onKeepInstead} />
            </View>
        </View>
    );
});

const DownloadRow = memo(({ row, compact, onStop, onRetry, onDelete, onKeepInstead }: DownloadRowProps) => {
    if (row.source === 'icloud')
        return <ICloudDownloadRow row={row} compact={compact} onStop={onStop} onRetry={onRetry} onDelete={onDelete} onKeepInstead={onKeepInstead} />;

    return <ServerDownloadRow row={row} onStop={onStop} onRetry={onRetry} onDelete={onDelete} />;
});

export const DownloadModalView = memo(({
    visible,
    rows,
    nested,
    compact = false,
    onStop,
    onRetry,
    onDelete,
    onKeepInstead = () => {},
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
                            compact={compact}
                            onStop={onStop}
                            onRetry={onRetry}
                            onDelete={onDelete}
                            onKeepInstead={onKeepInstead}
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
    icloudStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icloudSpinner: {
        marginRight: 6,
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
