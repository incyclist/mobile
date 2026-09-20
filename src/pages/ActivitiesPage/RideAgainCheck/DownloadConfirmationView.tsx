import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dialog } from '../../../components/Dialog';
import { colors, textSizes } from '../../../theme';
import { formatBytes } from './videoNoticeContent';

export interface DownloadConfirmationInfo {
    routeTitle: string;
    sizeBytes?: number;
    freeBytes?: number;
    fileCount: number;
    offline: boolean;
}

export interface DownloadConfirmationViewProps {
    confirmation: DownloadConfirmationInfo;
    device: 'iPad' | 'iPhone';
    onNotNow: () => void;
    onDownloadForThisRide: () => void;
    onDownloadAndKeep: () => void;
}

/**
 * "Download this video?" - shown once, the first time a route's video download is confirmed in
 * this app session. Isolated the same way the notice above is: a single, swappable unit built
 * against the services-owned `confirmation` contract, not a copy of anything else's markup.
 */
export const DownloadConfirmationView = ({
    confirmation,
    device,
    onNotNow,
    onDownloadForThisRide,
    onDownloadAndKeep,
}: DownloadConfirmationViewProps) => {
    const size = formatBytes(confirmation.sizeBytes);
    const free = formatBytes(confirmation.freeBytes);
    const multi = confirmation.fileCount > 1;

    const title = multi ? 'Download these videos?' : 'Download this video?';
    const intro = multi
        ? `${confirmation.fileCount} videos for "${confirmation.routeTitle}" are stored in iCloud Drive, not on this ${device}. To ride it, Incyclist first has to download them.`
        : `"${confirmation.routeTitle}" is stored in iCloud Drive, not on this ${device}. To ride it, Incyclist first has to download it.`;

    return (
        <View style={styles.wrapper}>
            <Dialog
                variant="info"
                title={title}
                nested
                buttons={[
                    { label: 'Not Now', onClick: onNotNow },
                    { label: 'Download for This Ride', onClick: onDownloadForThisRide },
                    { label: 'Download and Keep', onClick: onDownloadAndKeep, primary: true },
                ]}
                onOutsideClick={onNotNow}
            >
                <Text style={styles.intro}>{intro}</Text>
                {(size || free) && (
                    <Text style={styles.facts}>
                        {size ? `Size ${size}` : ''}{size && free ? ' · ' : ''}{free ? `Free space ${free} on this ${device}` : ''}
                    </Text>
                )}
                <Text style={styles.facts}>Can take a while for large videos, depending on your internet connection.</Text>
                <Text style={styles.body}>It keeps downloading even if you close Incyclist.</Text>
                {confirmation.offline && (
                    <Text style={styles.body}>You're offline. The download starts by itself as soon as you're back online.</Text>
                )}
                <Text style={styles.choice}>
                    • Download and Keep: the video is kept on this {device} for your next rides. You can remove it later in the route details.
                </Text>
                <Text style={styles.choice}>
                    • Download for This Ride: removed again automatically when you leave the ride.
                </Text>
            </Dialog>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    intro: {
        color: colors.text,
        fontSize: textSizes.normalText,
        padding: 16,
        paddingBottom: 4,
    },
    facts: {
        color: colors.text,
        fontSize: textSizes.smallText,
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    body: {
        color: colors.text,
        fontSize: textSizes.smallText,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    choice: {
        color: colors.text,
        fontSize: textSizes.smallText,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
});
