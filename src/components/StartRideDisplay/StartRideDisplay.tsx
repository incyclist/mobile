import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Dialog } from '../../components/Dialog';
import { colors, textSizes } from '../../theme';
import { useScreenLayout, useWhyDidYouRender } from '../../hooks';
import { PhasedStartContent, ContentRowInfo } from './PhasedStartContent';
import { contentRowStatus, deviceRowStatus, lineSlot, phaseHeading } from './phasedStart';
import { usePhasedStartModel } from './usePhasedStartModel';
import {
    CurrentRideDeviceInfo,
    StartDeviceInfo,
    GPXStartOverlayProps,
    RideMapState,
    StartRideDisplayProps,
    SvViewState,
    VideoStartOverlayProps,
} from './types';

const viewStateText = (viewState: SvViewState | undefined) => {
    switch (viewState) {
        case 'loaded': return { text: 'Loaded', color: colors.success };
        case 'unavailable': return { text: 'Unavailable – using Map', color: colors.warning };
        case 'loading': return { text: 'Loading ...', color: colors.text };
        case 'slow': return { text: 'Still loading ...', color: colors.text };
        case 'waiting':
        default: return { text: 'Waiting', color: colors.text };
    }
};

// phones shorter than this show the notice's first line only
const SHORT_SCREEN_HEIGHT = 340;

const startingTitle = (viewState: SvViewState | undefined) =>
    viewState === 'loading' || viewState === 'slow' ? 'Preparing Street View ...' : 'Starting activity ...';

const startingButtons = (
    readyToStart: boolean | undefined,
    viewState: SvViewState | undefined,
    onStart: (() => void) | undefined,
    onStartWithMap: (() => void) | undefined,
    onCancel: StartRideDisplayProps['onCancel'],
) => [
    ...(readyToStart ? [{ id: 'start', label: 'Start', primary: true, onClick: onStart! }] : []),
    ...(viewState === 'slow' && onStartWithMap ? [{ id: 'start-with-map', label: 'Start with Map', primary: false, onClick: onStartWithMap }] : []),
    { id: 'cancel', label: 'Cancel', onClick: () => onCancel?.() },
];

export const StartRideDisplay = (props: StartRideDisplayProps) => {
    const {
        devices, rideState, readyToStart, onStart, onRetry, onCancel, onIgnore, onStartWithMap,
        startPhase, startSlow, startContent, startReadyInfo, onRetryDevice, onIgnoreDevice,
    } = props;

    // FIXES_BACKLOG #52 — iOS start overlay was reported stuck showing Cancel-only although
    // services logged readyToStart:true. No re-render/memoization bug was found while tracing the
    // observer -> page-service -> StartRideDisplay chain (see PR description), but the log that
    // triggered this investigation had no re-render information for this component at all, only
    // for StreetView. Log every prop-reference change here so a recurrence can be diagnosed
    // straight from a user's event log without a reproduction.
    useWhyDidYouRender('StartRideDisplay', props, true);

    const layout = useScreenLayout();
    const { height: screenHeight } = useWindowDimensions();
    const compact = layout === 'compact';
    const phasedModel = usePhasedStartModel({
        devices: (devices ?? []) as StartDeviceInfo[],
        phase: startPhase,
        content: startContent,
        readyInfo: startReadyInfo,
        collapseResolved: compact,
    });

    const isVideoRide = 'videoState' in props;
    const isGPXRide = 'mapType' in props;

    // Street View-specific content only - gated on `viewState` so Video, Workout-only and
    // Map/Satellite starts render exactly as before. Mirrors web-ui's StartRideOverlay; this is
    // the gate because mapType is also set for the Map/Satellite rows, which must stay untouched.
    const viewState = isGPXRide ? (props as GPXStartOverlayProps).viewState : undefined;
    const isStreetViewStart = viewState !== undefined;

    // State determination logic
    const controlDeviceError = (devices??[]).find(d => d.isControl && d.status === 'Error');
    const mapError = isGPXRide && (props as any).mapStateError;
    const videoError = isVideoRide && (props as any).videoState === 'Start:Failed';
    // start overlay v2 (startPhase provided) shows a failed sensor inline, the separate sensor-error
    // screen is only kept for the legacy path
    const isPhased = startPhase !== undefined;
    const sensorError = !isPhased && rideState === 'Error' && devices.find(d => !d.isControl && d.status === 'Error');

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

    const getLoadingText = (): string | undefined => {
        if (isVideoRide) return videoStateText(props as VideoStartOverlayProps).text;
        if (isStreetViewStart) return viewStateText(viewState).text;
        return undefined;
    };

    const getLine = (): string | undefined => startPhase ? lineSlot(startPhase, startSlow, startContent) : undefined;

    const getContentRow =(): ContentRowInfo | undefined => {
        if (!startContent || !phasedModel.showContentRow) return undefined;
        return { label: startContent.label, status: contentRowStatus(startContent, getLoadingText()) };
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
                    <Text style={[styles.statusCell, { color: (isStreetViewStart ? viewStateText(viewState) : mapStateText((props as any).mapState)).color }]}>
                        {(isStreetViewStart ? viewStateText(viewState) : mapStateText((props as any).mapState)).text}
                    </Text>
                </View>
            )}
        </View>
    );

    const minWidth = compact ? '80%' : '40%';

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

    if (isPhased) {
        return (
            <Dialog
                title={phaseHeading(startPhase, startContent)}
                variant="info"
                minWidth={minWidth}
                scrollable={false}
                footerNote={phasedModel.footerNote}
                buttons={startingButtons(readyToStart || startPhase === 'ready', viewState, onStart, onStartWithMap, onCancel)}
            >
                <PhasedStartContent
                    line={getLine()}
                    notice={phasedModel.notice}
                    shortScreen={screenHeight < SHORT_SCREEN_HEIGHT}
                    compact={compact}
                    controls={phasedModel.controls}
                    sensors={phasedModel.sensors}
                    content={getContentRow()}
                    showDivider={phasedModel.showDivider}
                    statusOf={deviceRowStatus}
                    onRetryDevice={onRetryDevice}
                    onIgnoreDevice={onIgnoreDevice}
                />
            </Dialog>
        );
    }

    // Default 'starting' state
    return (
        <Dialog
            title={startingTitle(viewState)}
            variant="info"
            minWidth={minWidth}
            buttons={startingButtons(readyToStart, viewState, onStart, onStartWithMap, onCancel)}
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
