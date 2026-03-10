import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dialog } from '../../components/Dialog';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { 
    CurrentRideDeviceInfo,
    RideMapState,
    StartRideDisplayProps,
    VideoStartOverlayProps, 
} from './types';

export const StartRideDisplay = (props: StartRideDisplayProps) => {
    const { devices, rideState, readyToStart, onStart, onRetry, onCancel, onIgnore } = props;

    console.log('# [StartRideDisplay] render',props)
    const layout = useScreenLayout();

    const isVideoRide = 'videoState' in props;
    const isGPXRide = 'mapType' in props;

    // State determination logic
    const controlDeviceError = (devices??[]).find(d => d.isControl && d.status === 'Error');
    const mapError = isGPXRide && (props as any).mapStateError;
    const videoError = isVideoRide && (props as any).videoState === 'Start:Failed';
    const sensorError = rideState === 'Error' && devices.find(d => !d.isControl && d.status === 'Error');

    let displayState: 'device-error' | 'map-error' | 'video-error' | 'sensor-error' | 'starting' = 'starting';

    if (controlDeviceError) {
        displayState = 'device-error';
    } else if (mapError) {
        displayState = 'map-error';
    } else if (videoError) {
        displayState = 'video-error';
    } else if (sensorError) {
        displayState = 'sensor-error';
    }

    const deviceStatusText = (device: CurrentRideDeviceInfo) => {
        if (device.stateText) return { text: device.stateText, color: colors.text };
        if (device.status === 'Started') return { text: 'Started', color: colors.success };
        if (device.status === 'Starting') return { text: 'Starting ...', color: colors.text };
        if (device.status === 'Error') return { text: 'Failed', color: colors.error };
        return { text: device.status, color: colors.text };
    };

    const videoStateText = (videoProps: VideoStartOverlayProps) => {
        const { videoState, videoProgress } = videoProps;
        if (videoState === 'Started') return { text: 'Started', color: colors.success };
        if (videoState === 'Starting') {
            if (!videoProgress?.loaded) return { text: 'Starting ...', color: colors.text };
            if (videoProgress.loaded && !videoProgress.bufferTime) return { text: 'Buffering ...', color: colors.text };
            if (videoProgress.loaded && videoProgress.bufferTime > 0) {
                return { text: `Buffering (${Math.round(videoProgress.bufferTime)}s)`, color: colors.text };
            }
        }
        return { text: videoState as string, color: colors.text };
    };

    const mapStateText = (mapState: RideMapState) => {
        if (mapState === 'Loaded') return { text: 'Loaded', color: colors.success };
        if (mapState === 'Loading') return { text: 'Loading ...', color: colors.text };
        if (mapState === 'Error') return { text: 'Error', color: colors.error };
        return { text: mapState as string, color: colors.text };
    };

    const renderDeviceList = () => (
        <View style={styles.listContainer}>
            {devices.map(device => {
                const status = deviceStatusText(device);
                return (
                    <View key={device.udid} style={styles.row}>
                        <Text style={styles.labelCell} numberOfLines={1}>{device.name}</Text>
                        <Text style={[styles.statusCell, { color: status.color }]}>{status.text}</Text>
                    </View>
                );
            })}
            {isVideoRide && (
                <View style={styles.row}>
                    <Text style={styles.labelCell}>Video</Text>
                    <Text style={[styles.statusCell, { color: videoStateText(props as VideoStartOverlayProps).color }]}>
                        {videoStateText(props as VideoStartOverlayProps).text}
                    </Text>
                </View>
            )}
            {isGPXRide && (
                <View style={styles.row}>
                    <Text style={styles.labelCell}>{(props as any).mapType}</Text>
                    <Text style={[styles.statusCell, { color: mapStateText((props as any).mapState).color }]}>
                        {mapStateText((props as any).mapState).text}
                    </Text>
                </View>
            )}
        </View>
    );

    const minWidth = layout === 'compact' ? '80%' : '40%';

    if (displayState === 'device-error') {
        const failedDevice = devices.find(d => d.isControl && d.status === 'Error');
        const failedDeviceName = failedDevice?.name ?? 'SmartTrainer';

        return (
            <Dialog 
                title="Start failed"
                titleStyle={{ color: colors.error }}
                variant="info"
                minWidth={minWidth}
                buttons={[
                    { id: 'retry', label: 'Retry', primary: true, onClick: onRetry! },
                    { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.({ device: true }) }
                ]}
            >
                <View style={styles.bodyContainer}>
                    <View style={styles.reasonRow}>
                        <Text style={styles.reasonLabel}>Reason: </Text>
                        <Text style={styles.bodyText}>Could not start {failedDeviceName}</Text>
                    </View>
                    <View style={styles.spacer} />
                    <Text style={styles.bodyText}>
                        Please switch off the device, wait 5s, switch it on and try again
                    </Text>
                </View>
            </Dialog>
        );
    }

    if (displayState === 'sensor-error') {
        return (
            <Dialog 
                title="Could not start Sensor(s)"
                titleStyle={{ color: colors.warning }}
                variant="info"
                minWidth={minWidth}
                buttons={[
                    { id: 'retry', label: 'Retry', primary: false, onClick: onRetry! },
                    { id: 'ignore', label: 'Ignore', primary: true, onClick: onIgnore! },
                    { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.({ device: true }) }
                ]}
            >
                <View style={styles.bodyContainer}>
                    {renderDeviceList()}
                </View>
            </Dialog>
        );
    }

    if (displayState === 'video-error') {
        return (
            <Dialog 
                title="Start failed"
                titleStyle={{ color: colors.error }}
                variant="info"
                minWidth={minWidth}
                buttons={[
                    { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.({ video: true }) }
                ]}
            >
                <View style={styles.bodyContainer}>
                    <View style={styles.reasonRow}>
                        <Text style={styles.reasonLabel}>Reason: </Text>
                        <Text style={styles.bodyText}>{(props as VideoStartOverlayProps).videoStateError || 'Could not load video.'}</Text>
                    </View>
                </View>
            </Dialog>
        );
    }

    if (displayState === 'map-error') {
        return (
            <Dialog 
                title="Start failed"
                titleStyle={{ color: colors.error }}
                variant="info"
                minWidth={minWidth}
                buttons={[
                    { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.({ map: true }) }
                ]}
            >
                <View style={styles.bodyContainer}>
                    <View style={styles.reasonRow}>
                        <Text style={styles.reasonLabel}>Reason: </Text>
                        <Text style={styles.bodyText}>{(props as any).mapStateError}</Text>
                    </View>
                </View>
            </Dialog>
        );
    }

    // Default 'starting' state
    const startingButtons = readyToStart 
        ? [
            { id: 'start', label: 'Start', primary: true, onClick: onStart! },
            { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.() }
          ]
        : [
            { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.() }
          ];

    return (
        <Dialog 
            title="Starting activity ..."
            variant="info"
            minWidth={minWidth}
            buttons={startingButtons}
        >
            <View style={styles.bodyContainer}>
                {renderDeviceList()}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    bodyContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    listContainer: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 4,
        alignItems: 'center',
    },
    labelCell: {
        width: '45%',
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    statusCell: {
        width: '45%',
        fontSize: textSizes.normalText,
    },
    bodyText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    reasonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingTop: 8,
    },
    reasonLabel: {
        fontWeight: 'bold',
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    spacer: {
        height: 8,
    },
});
