import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { RouteVideoDisplayProps, VideoKeepChoice } from 'incyclist-services';
import { Dialog } from '../../../components/Dialog';
import { useScreenLayout } from '../../../hooks';
import { VideoNoticeView } from './VideoNoticeView';
import { DownloadConfirmationView } from './DownloadConfirmationView';
import { buildAccessOutcomeContent, buildVideoNotice, getPrimaryAction, isPrimaryActionDisabled, PRIMARY_ACTION_LABEL } from './videoNoticeContent';

export interface RideAgainCheckDialogViewProps {
    routeTitle: string;
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
 * pre-check finds the route's video isn't playable yet. Renders the same states route details
 * shows for a route's video, plus its own download confirmation when one is pending.
 */
export const RideAgainCheckDialogView = (props: RideAgainCheckDialogViewProps) => {
    const {
        routeTitle, video, downloadedWhileOpen, compact,
        onClose, onStart,
        onDownloadPress, onDownloadConfirmed, onDownloadDismissed,
        onStop, onRetry, onKeepInstead, onConfirmAccess,
    } = props;

    const layout = useScreenLayout();
    const isCompact = compact ?? layout === 'compact';
    const device = isCompact ? 'iPhone' : 'iPad';

    const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen });
    const outcome = video.access?.lastResult ? buildAccessOutcomeContent(video.access.lastResult.outcome) : undefined;

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
                {outcome && <VideoNoticeView notice={outcome} />}
                {notice && <VideoNoticeView notice={notice} onKeepInsteadPress={onKeepInstead} />}
            </Dialog>

            {video.confirmation && (
                <DownloadConfirmationView
                    confirmation={video.confirmation}
                    device={device}
                    onNotNow={onDownloadDismissed}
                    onDownloadForThisRide={() => onDownloadConfirmed('this-ride')}
                    onDownloadAndKeep={() => onDownloadConfirmed('keep')}
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
});
