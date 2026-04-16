import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import type { UIRouteSettings, RoutePoint } from 'incyclist-services';
import { useUnitConverter, getPosition } from 'incyclist-services';
import { RouteDetailsViewProps } from './types';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { colors } from '../../theme';
import { useLogging, useUnmountEffect } from '../../hooks';
import { BinarySelect } from '../BinarySelect';
import { EditNumber } from '../EditNumber';
import { ChipSelect } from '../ChipSelect';
import { SingleSelect } from '../SingleSelect';
import { DownloadModalView } from '../DownloadModal';

const SEGMENT_CHIP_THRESHOLD = 5;

export const RouteDetailsView = (props: RouteDetailsViewProps) => {
    const {
        title, compact, hasGpx, points, previewUrl, totalDistance,
        totalElevation, routeType, canStart, canNotStartReason,
        showLoopOverwrite, showNextOverwrite, showWorkout, loading,
        initialSettings, segments, prevRides, showPrev: initialShowPrev,
        onStart, onCancel, onStartWithWorkout, onSettingsChanged, onUpdateStartPos,
        downloadButtonLabel, downloadButtonDisabled, onDownloadPress,
        showDownloadModal, onDownloadModalClose, downloadRows,
        onDownloadStop, onDownloadRetry, onDownloadDelete
    } = props;

    const { logEvent } = useLogging('RouteDetailsView');
    const [data, setData] = useState<UIRouteSettings>(initialSettings);
    const refMounted = useRef(true);
    useUnmountEffect(() => { refMounted.current = false; });

    const converter = useUnitConverter();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    useEffect(() => {
        setData(prev => ({ ...prev, prevRides, showPrev: initialShowPrev }));
    }, [prevRides, initialShowPrev]);

    const handleApplySettings = useCallback(async (updated: UIRouteSettings) => {
        setData(updated); // Optimistic update
        const result = await onSettingsChanged(updated);
        if (refMounted.current && result) {
            setData(prev => ({ ...prev, ...result })); // Merge service adjustments
        }
    }, [onSettingsChanged]);

    const handleSegmentSelect = useCallback((segName: string) => {
        logEvent({ message: 'option selected', field: 'segment', value: segName, eventSource: 'user' });
        if (segName === 'All') {
            handleApplySettings({
                ...data,
                segment: undefined,
                startPos: { value: 0, unit: data.startPos?.unit ?? 'km' },
                endPos: undefined
            });
            return;
        }
        const seg = segments?.find(s => s.name === segName);
        if (seg) {
            handleApplySettings({
                ...data,
                segment: segName,
                startPos: { value: converter.convert(Number(seg.start), 'distance', { from: 'm', to: data.startPos?.unit ?? 'km' }), unit: data.startPos?.unit ?? 'km' },
                endPos: { value: converter.convert(Number(seg.end), 'distance', { from: 'm', to: data.startPos?.unit ?? 'km' }), unit: data.startPos?.unit ?? 'km' }
            });
        }
    }, [data, segments, converter, handleApplySettings, logEvent]);

    const handleStartPosValueChange = useCallback((value?: number) => {
        const result = onUpdateStartPos(value ?? 0);
        if (result) {
            handleApplySettings({ ...data, ...result });
        } else {
            handleApplySettings({
                ...data,
                startPos: { value: value ?? 0, unit: data.startPos?.unit ?? 'km' }
            });
        }
    }, [onUpdateStartPos, handleApplySettings, data]);

    const handleRealityFactorChange = useCallback((value?: number) => {
        handleApplySettings({ ...data, realityFactor: value ?? 100 });
    }, [handleApplySettings, data]);

    const handleLoopOverwriteChange = useCallback((v: boolean) => {
        handleApplySettings({ ...data, loopOverwrite: v });
    }, [handleApplySettings, data]);

    const handleNextOverwriteChange = useCallback((v: boolean) => {
        handleApplySettings({ ...data, nextOverwrite: v });
    }, [handleApplySettings, data]);

    const handleShowPrevChange = useCallback((v: boolean) => {
        handleApplySettings({ ...data, showPrev: v });
    }, [handleApplySettings, data]);


    const markerPosition = useMemo(() => {
        if (!points?.length || data.startPos === undefined) return undefined;
        const startPosMeters = converter.convert(
            data.startPos.value, 'distance',
            { from: data.startPos.unit ?? 'km', to: 'm' }
        );
        const point = getPosition(
            points as unknown as Array<RoutePoint>,
            { distance: startPosMeters }
        );
        return point ? { lat: point.lat, lng: point.lng } : undefined;
    }, [points, data.startPos, converter]);

    const handleRoutePositionChanged = useCallback((distanceMeters: number) => {
        const displayValue = converter.convert(
            distanceMeters, 'distance',
            { from: 'm', to: data.startPos?.unit ?? 'km' }
        );
        const result = onUpdateStartPos(displayValue);
        if (result) {
            handleApplySettings({ ...data, ...result });
        } else {
            handleApplySettings({
                ...data,
                startPos: { value: displayValue, unit: data.startPos?.unit ?? 'km' }
            });
        }
    }, [converter, data, onUpdateStartPos, handleApplySettings]);

    const MEDIA_ROW_PADDING = 20; // 10px each side from styles.mediaRow padding
    const MEDIA_ROW_GAP = 10;
    const containerWidth = (screenWidth - MEDIA_ROW_PADDING - MEDIA_ROW_GAP) / 2;
    const mediaRowHeight = Math.round(containerWidth * (screenHeight / screenWidth));
    const mediaRowStyle = { ...styles.mediaRow, height: mediaRowHeight };


    const renderMedia = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (hasGpx && points?.length) {
            return (
                <FreeMap
                    points={points}
                    startPos={0}
                    zoom={12}
                    draggable={true}
                    position={markerPosition}
                    onRoutePositionChanged={handleRoutePositionChanged}
                />
            );
        }
        return <Text style={styles.placeholderText}>Map not available</Text>;
    };

    const renderPreview = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (previewUrl) {
            return <Image source={{ uri: previewUrl }} style={styles.fullMedia} resizeMode="cover" />;
        }
        return <Text style={styles.placeholderText}>No preview available</Text>;
    };

    const renderForm = () => {
        const useChips = !compact && (segments?.length ?? 0) <= SEGMENT_CHIP_THRESHOLD;

        return (
            <>
                {segments && segments.length > 0 && (
                    useChips ? (
                        <ChipSelect
                            label=''
                            labelWidth={0}
                            options={['All', ...segments.map(s => s.name)]}
                            selected={data.segment ?? 'All'}
                            onValueChange={handleSegmentSelect}
                        />
                    ) : (
                        <SingleSelect
                            label='Segment'
                            options={['All', ...segments.map(s => s.name)]}
                            selected={data.segment ?? 'All'}
                            onValueChange={handleSegmentSelect}
                        />
                    )
                )}
                <View style={styles.inputRow}>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber
                            label='Start'
                            unit={data.startPos?.unit ?? 'km'}
                            value={data.startPos?.value ?? 0}
                            min={0}
                            max={totalDistance.value}
                            digits={1}
                            onValueChange={handleStartPosValueChange}
                        />
                    </View>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber
                            label='Reality'
                            unit='%'
                            value={data.realityFactor ?? 100}
                            min={0}
                            max={100}
                            digits={0}
                            onValueChange={handleRealityFactorChange}
                        />
                    </View>
                </View>

                {data.endPos !== undefined && (
                    <View style={styles.inputRow}>
                        <View style={styles.editNumberWrapper}>
                            <EditNumber
                                label='End'
                                unit={data.endPos.unit}
                                value={data.endPos.value}
                                disabled={true}
                                digits={1}
                            />
                        </View>
                        <View style={styles.editNumberWrapper} />
                    </View>
                )}

                <View style={styles.switchGrid}>
                    {showLoopOverwrite && (
                        <BinarySelect
                            label="Stop at end of loop"
                            labelPosition="before"
                            value={data.loopOverwrite ?? false}
                            onValueChange={handleLoopOverwriteChange}
                        />
                    )}
                    {showNextOverwrite && (
                        <BinarySelect
                            label="Stop at end of movie"
                            labelPosition="before"
                            value={data.nextOverwrite ?? false}
                            onValueChange={handleNextOverwriteChange}
                        />
                    )}
                    {data.prevRides && (
                        <BinarySelect
                            label="Compare prev rides"
                            labelPosition="before"
                            value={data.showPrev ?? false}
                            onValueChange={handleShowPrevChange}
                        />
                    )}
                </View>
            </>
        );
    };

    const dialogButtons = [
        { label: 'Cancel', onClick: onCancel },
        ...(downloadButtonLabel ? [{
            label: downloadButtonLabel,
            disabled: downloadButtonDisabled,
            onClick: onDownloadPress,
            primary: downloadButtonLabel === 'Download',
        }] : []),
        ...(canStart ? [
            { label: 'Start', primary: true, onClick: () => onStart(data) },
            ...(showWorkout ? [{ label: 'Start with Workout', onClick: () => onStartWithWorkout(data) }] : [])
        ] : [])
    ];

    if (compact) {
        const showCompactPanel = (hasGpx && !!points?.length) || !!previewUrl;

        return (
            <Dialog title={title} variant="full" buttons={dialogButtons} onOutsideClick={onCancel}>
                <View style={styles.compactRoot}>
                    <View style={styles.compactLeft}>
                        {renderForm()}
                    </View>
                    {showCompactPanel && (
                        <View style={styles.compactRight}>
                            {hasGpx && points?.length ? renderMedia() : renderPreview()}
                        </View>
                    )}
                </View>
                <View style={styles.infoBar}>
                    <Text style={styles.infoBarText}>
                        {routeType} • {totalDistance.value}{totalDistance.unit} • {totalElevation.value}{totalElevation.unit}
                    </Text>
                    {canNotStartReason && <Text style={styles.errorText}>{canNotStartReason}</Text>}
                </View>
                <DownloadModalView
                    visible={!!showDownloadModal}
                    rows={downloadRows ?? []}
                    onStop={onDownloadStop ?? (() => {})}
                    onRetry={onDownloadRetry ?? (() => {})}
                    onDelete={onDownloadDelete ?? (() => {})}
                    onClose={onDownloadModalClose ?? (() => {})}
                />
            </Dialog>
        );
    }

    return (
        <Dialog title={title} variant="full" buttons={dialogButtons} onOutsideClick={onCancel}>
            <View style={mediaRowStyle}>
                <View style={styles.mediaContainer}>{renderMedia()}</View>
                <View style={styles.mediaContainer}>{renderPreview()}</View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{totalDistance.value} {totalDistance.unit}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Elevation</Text>
                    <Text style={styles.statValue}>{totalElevation.value} {totalElevation.unit}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Type</Text>
                    <Text style={styles.statValue}>{routeType}</Text>
                </View>
            </View>
            <View style={styles.settingsArea}>
                {renderForm()}
                {canNotStartReason && <Text style={styles.fullErrorText}>{canNotStartReason}</Text>}
            </View>
            <DownloadModalView
                visible={!!showDownloadModal}
                rows={downloadRows ?? []}
                onStop={onDownloadStop ?? (() => {})}
                onRetry={onDownloadRetry ?? (() => {})}
                onDelete={onDownloadDelete ?? (() => {})}
                onClose={onDownloadModalClose ?? (() => {})}
            />
        </Dialog>
    );
};

const styles = StyleSheet.create({
    mediaRow: { flexDirection: 'row', gap: 10, padding: 10 },
    mediaContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    fullMedia: { width: '100%', height: '100%' },
    placeholderText: { color: colors.disabled, fontSize: 12 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { color: colors.disabled, fontSize: 10, textTransform: 'uppercase' },
    statValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
    settingsArea: { padding: 15 },
    inputRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    editNumberWrapper: { flex: 1 },
    switchGrid: { gap: 4 },
    compactRoot: { flexDirection: 'row', padding: 10, gap: 15 },
    compactLeft: { flex: 1 },
    compactRight: { width: '35%', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, overflow: 'hidden' },
    infoBar: { paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center' },
    infoBarText: { color: colors.disabled, fontSize: 12 },
    errorText: { color: colors.error, fontSize: 11, marginTop: 4 },
    fullErrorText: { color: colors.error, fontSize: 13, marginTop: 10, textAlign: 'center' },
});