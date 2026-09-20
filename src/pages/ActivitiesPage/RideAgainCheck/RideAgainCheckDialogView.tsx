import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RouteVideoDisplayProps, VideoKeepChoice } from 'incyclist-services';
import { Dialog } from '../../../components/Dialog';
import { useScreenLayout } from '../../../hooks';
import { VideoNoticeView } from '../../../components/RouteDetailsDialog/video/VideoNoticeView';
import { VideoDownloadConfirmView } from '../../../components/RouteDetailsDialog/video/VideoDownloadConfirmView';
import { colors } from '../../../theme';
import { getPrimaryAction, isPrimaryActionDisabled, PRIMARY_ACTION_LABEL } from './primaryAction';

export interface RideAgainCheckDialogViewProps {
    video: RouteVideoDisplayProps;
    downloadedWhileOpen: boolean;
    compact?: boolean;

    onClose: () => void;
    onStart: () => void;

    onDownloadPress: () => void;
    onDownloadConfirmed: (choice: VideoKeepChoice) => void;
    onDownloadDismissed: () => void;
    onStop: () => void;
    onRetry: () => void;
    onKeepInstead: () => void;
    onConfirmAccess: () => void;
}

/**
 * "Before you ride" - shown instead of navigating straight to the ride when Ride Again's video
 * pre-check finds the route's video isn't playable yet. Renders the same notice and download
 * confirmation route details shows for a route's video, plus a one-off confirmation line when the
 * download finished while this dialog was already open.
 */
export const RideAgainCheckDialogView = (props: RideAgainCheckDialogViewProps) => {
    const {
        video, downloadedWhileOpen, compact,
        onClose, onStart,
        onDownloadPress, onDownloadConfirmed, onDownloadDismissed,
        onStop, onRetry, onKeepInstead, onConfirmAccess,
    } = props;

    const layout = useScreenLayout();
    const isCompact = compact ?? layout === 'compact';
    const deviceWord = isCompact ? 'iPhone' : 'iPad';

    // The shared notice stays silent for a plain 'ready' state (route details has no use for a
    // "just downloaded" line), so that one case is layered on top here instead. thisRide takes
    // priority, matching the shared notice's own precedence for that state.
    const justDownloaded = downloadedWhileOpen && video.status.state === 'ready' && !video.status.thisRide;

    const primaryKind = getPrimaryAction(video);
    const primaryHandlers: Record<string, () => void> = {
        download: onDownloadPress,
        stop: onStop,
        retry: onRetry,
        confirmAccess: onConfirmAccess,
        rideAgain: onStart,
    };

    const buttons = [
        { label: 'Close', onClick: onClose },
        ...(primaryKind !== 'none' ? [{
            label: PRIMARY_ACTION_LABEL[primaryKind],
            onClick: primaryHandlers[primaryKind],
            primary: true,
            disabled: isPrimaryActionDisabled(video),
        }] : []),
    ];

    return (
        <View style={styles.wrapper}>
            <Dialog
                variant="info"
                title="Before you ride"
                minWidth={isCompact ? '85%' : '50%'}
                buttons={buttons}
                onOutsideClick={onClose}
            >
                {justDownloaded && (
                    <View style={styles.downloadedLine}>
                        <Text style={styles.downloadedText}>✓ Video downloaded</Text>
                    </View>
                )}
                <VideoNoticeView
                    video={video}
                    deviceWord={deviceWord}
                    compact={isCompact}
                    onKeepInstead={onKeepInstead}
                />
            </Dialog>

            {video.confirmation && (
                <VideoDownloadConfirmView
                    confirmation={video.confirmation}
                    downloadEnabled={video.actions.downloadEnabled}
                    deviceWord={deviceWord}
                    compact={isCompact}
                    onConfirm={onDownloadConfirmed}
                    onDismiss={onDownloadDismissed}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        // Dialog renders its own Modal, so the confirmation below stacks as a sibling Modal
        // rather than a nested view - this wrapper only groups them for a single mount point.
    },
    downloadedLine: { paddingHorizontal: 15, paddingVertical: 6 },
    downloadedText: { color: colors.success, fontSize: 13 },
});
