import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import type { UIRouteSettings, RoutePoint } from 'incyclist-services';
import { useUnitConverter, getPosition } from 'incyclist-services';
import { RouteDetailsViewProps, Segment, SmoothingPreviewProps } from './types';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { colors } from '../../theme';
import { useLogging, useUnmountEffect } from '../../hooks';
import { BinarySelect } from '../BinarySelect';
import { EditNumber } from '../EditNumber';
import { ChipSelect } from '../ChipSelect';
import { SingleSelect } from '../SingleSelect';
import { DownloadModalView } from '../DownloadModal';
import { SecureImage } from '../SecureImage';
import { AttachmentChip } from '../AttachmentChip';
import { ElevationGraph } from '../ElevationGraph';

const SEGMENT_CHIP_THRESHOLD = 5;

const SMOOTHING_LABEL = 'Terrain Smoothing';
const SMOOTHING_OFF_OPTION = 'Off';
const SMOOTHING_MAX_LEVEL_FALLBACK = 5;
// Wide enough for 'Terrain Smoothing' on one line at normalText (16px), so the label sits beside
// the chips rather than above them - one row instead of two, which is what the compact layout has
// room for. 145 measured too narrow on-device (the label wrapped, pushing the switch grid below
// it down far enough to nearly clear the fold) - 180 carries a real margin at this font size.
const SMOOTHING_LABEL_WIDTH = 180;
// The chips are the whole interaction here: the user taps through levels repeatedly to compare
// them against the profile. The default chip is around 32px tall, so this raises it to the 44px
// touch-target floor - locally, leaving every other ChipSelect in the app as it is.
const SMOOTHING_CHIP_MIN_HEIGHT = 44;

const SMOOTHING_COPY_OFF = 'Softens sharp gradient changes for steadier trainer resistance.';
const SMOOTHING_COPY_ON = 'Riding a smoothed profile. Your saved route is unchanged.';

const MINUS = '−';

const getSmoothingLevel = (settings: { smoothingLevel?: number }): number =>
    Number.isFinite(settings.smoothingLevel) ? Math.max(0, Math.round(settings.smoothingLevel as number)) : 0;

type MediaLayoutInputs = {
    loading: boolean;
    points?: RoutePoint[];
    routeData?: RouteDetailsViewProps['routeData'];
    hasGpx: boolean;
    isOnline: boolean;
    previewUrl?: string;
    screenWidth: number;
    screenHeight: number;
};

type MediaLayout = {
    hasProfile: boolean;
    showMap: boolean;
    showMapPanel: boolean;
    showProfileStrip: boolean;
    showPreviewColumn: boolean;
    mediaRowStyle: { height: number };
    mediaBoxSize: { width: number; height: number };
    graphColumnSize: { width: number; height: number };
};

// Below this, the chart stops being legible - the point at which the row shrinks further rather
// than squeezing the graph column past it.
const GRAPH_COLUMN_MIN_WIDTH = 80;
const MEDIA_ROW_PADDING = 20; // 10px each side from styles.mediaRow padding
const MEDIA_ROW_GAP = 10;

/**
 * What each of the three media surfaces needs, and how much screen they get.
 *
 * A route can have a readable profile and no usable GPS track (so: graph, no map), or a GPS
 * track and no network (so: profile only, and the map panel is dropped rather than left blank).
 * The map and the still are boxed at the screen's own aspect ratio (mobile is landscape-locked,
 * so this is the same shape a ride fills full-screen) rather than stretched to whatever the row's
 * height cap leaves. Uncapped, containerWidth*(H/W) resolves to roughly half the screen height on
 * every device - on the `full` layout that starves the settings form below it regardless of
 * aspect ratio, so it's capped to 30% of screen height first (a budget measured against real
 * on-device layouts so the form below always has room), and each box is then fitted within that
 * cap, never driving it.
 *
 * The graph reads as a chart, not a full-screen surface, so it doesn't need that same aspect
 * ratio - it takes whatever width is left over once the map/still boxes are placed, which is
 * usually real slack: the height cap above nearly always makes those boxes narrower than their
 * column. If there genuinely isn't enough left over, the row shrinks a little further (and the
 * boxes with it) to make room, rather than letting the three of them overflow the screen width.
 */
const computeMediaLayout = (inputs: MediaLayoutInputs): MediaLayout => {
    const { loading, points, routeData, hasGpx, isOnline, previewUrl, screenWidth, screenHeight } = inputs;

    const hasProfile = !loading && !!points?.length && !!routeData?.points?.length;
    const showMap = hasProfile && hasGpx && isOnline;
    // No GPS track: the profile takes the map's place instead of the map slot going empty.
    const showProfileInMapSlot = hasProfile && !hasGpx;
    // With a map, the profile gets its own column alongside the still - a peer, not an overlay.
    const showProfileStrip = hasProfile && hasGpx;
    const showMapPanel = loading || showMap || showProfileInMapSlot;
    const hasStill = !!previewUrl;
    // The still column shows whenever there is one, and also as the graph-less fallback (loading
    // spinner or "No preview available") whenever the graph isn't taking its place instead.
    const showPreviewColumn = hasStill || !showProfileStrip;

    const containerWidth = (screenWidth - MEDIA_ROW_PADDING - MEDIA_ROW_GAP) / 2;
    const screenAspectRatio = screenWidth / screenHeight;
    const computeBoxWidth = (rowHeight: number) => Math.min(containerWidth, Math.round(rowHeight * screenAspectRatio));

    let mediaRowHeight = Math.round(Math.min(containerWidth * (screenHeight / screenWidth), screenHeight * 0.3));
    let mediaBoxWidth = computeBoxWidth(mediaRowHeight);

    const numBoxedColumns = (showMapPanel ? 1 : 0) + (hasStill ? 1 : 0);
    const numColumns = numBoxedColumns + (showProfileStrip ? 1 : 0);
    const totalContentWidth = screenWidth - MEDIA_ROW_PADDING - Math.max(0, numColumns - 1) * MEDIA_ROW_GAP;
    let graphColumnWidth = totalContentWidth - numBoxedColumns * mediaBoxWidth;

    const notEnoughRoomForGraph = showProfileStrip && numBoxedColumns > 0 && graphColumnWidth < GRAPH_COLUMN_MIN_WIDTH;
    if (notEnoughRoomForGraph) {
        const maxBoxWidth = (totalContentWidth - GRAPH_COLUMN_MIN_WIDTH) / numBoxedColumns;
        mediaRowHeight = Math.max(1, Math.min(mediaRowHeight, Math.round(maxBoxWidth / screenAspectRatio)));
        mediaBoxWidth = computeBoxWidth(mediaRowHeight);
        graphColumnWidth = totalContentWidth - numBoxedColumns * mediaBoxWidth;
    }

    const mediaBoxHeight = Math.min(mediaRowHeight, Math.round(containerWidth / screenAspectRatio));

    return {
        hasProfile,
        showMap,
        showMapPanel,
        showProfileStrip,
        showPreviewColumn,
        mediaRowStyle: { ...styles.mediaRow, height: mediaRowHeight },
        mediaBoxSize: { width: mediaBoxWidth, height: mediaBoxHeight },
        graphColumnSize: { width: Math.max(0, Math.round(graphColumnWidth)), height: mediaRowHeight },
    };
};

type SettingsFormProps = {
    loading: boolean;
    compact: boolean;
    segments?: Segment[];
    data: UIRouteSettings;
    totalDistance: { value: number; unit: string };
    smoothingAvailable?: boolean;
    smoothingOptions: string[];
    smoothingLevel: number;
    smoothingDetailText?: string;
    showLoopOverwrite: boolean;
    showNextOverwrite: boolean;
    onSegmentSelect: (segName: string) => void;
    onStartPosValueChange: (value?: number) => void;
    onRealityFactorChange: (value?: number) => void;
    onSmoothingSelect: (option: string) => void;
    onLoopOverwriteChange: (v: boolean) => void;
    onNextOverwriteChange: (v: boolean) => void;
    onShowPrevChange: (v: boolean) => void;
};

/**
 * The Segment / Start / End / Reality / Terrain Smoothing / switches block - identical content on
 * both layouts, just placed differently by the caller (inside a ScrollView on compact, in
 * `settingsArea` on full). A separate component, not a closure, specifically so its own branching
 * (segment picker shape, compact vs full field layout, the optional smoothing row, three optional
 * switches) is scored on its own rather than folded into RouteDetailsView's.
 */
const RouteDetailsSettingsForm = (props: SettingsFormProps) => {
    const {
        loading, compact, segments, data, totalDistance,
        smoothingAvailable, smoothingOptions, smoothingLevel, smoothingDetailText,
        showLoopOverwrite, showNextOverwrite,
        onSegmentSelect, onStartPosValueChange, onRealityFactorChange, onSmoothingSelect,
        onLoopOverwriteChange, onNextOverwriteChange, onShowPrevChange,
    } = props;

    if (loading) {
        return (
            <View style={styles.formLoading}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.placeholderText}>Loading route details…</Text>
            </View>
        );
    }

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
                        onValueChange={onSegmentSelect}
                    />
                ) : (
                    <SingleSelect
                        label='Segment'
                        options={['All', ...segments.map(s => s.name)]}
                        selected={data.segment ?? 'All'}
                        onValueChange={onSegmentSelect}
                    />
                )
            )}
            {compact ? (
                <>
                    <View style={styles.inputRow}>
                        <View style={styles.editNumberWrapper}>
                            <EditNumber
                                label='Start'
                                unit={data.startPos?.unit ?? 'km'}
                                value={data.startPos?.value ?? 0}
                                min={0}
                                max={totalDistance.value}
                                digits={1}
                                onValueChange={onStartPosValueChange}
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
                                onValueChange={onRealityFactorChange}
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
                </>
            ) : (
                // full: Start / End / Reality share one row - End renders as an empty cell rather
                // than being absent when there is no segment, so Reality's column never shifts
                // depending on whether a segment is picked.
                <View style={styles.inputRow}>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber
                            label='Start'
                            unit={data.startPos?.unit ?? 'km'}
                            value={data.startPos?.value ?? 0}
                            min={0}
                            max={totalDistance.value}
                            digits={1}
                            onValueChange={onStartPosValueChange}
                        />
                    </View>
                    <View style={styles.editNumberWrapper}>
                        {data.endPos !== undefined && (
                            <EditNumber
                                label='End'
                                unit={data.endPos.unit}
                                value={data.endPos.value}
                                disabled={true}
                                digits={1}
                            />
                        )}
                    </View>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber
                            label='Reality'
                            unit='%'
                            value={data.realityFactor ?? 100}
                            min={0}
                            max={100}
                            digits={0}
                            onValueChange={onRealityFactorChange}
                        />
                    </View>
                </View>
            )}

            {smoothingAvailable && (
                <View style={styles.smoothingRow}>
                    <ChipSelect
                        label={SMOOTHING_LABEL}
                        labelWidth={SMOOTHING_LABEL_WIDTH}
                        chipMinHeight={SMOOTHING_CHIP_MIN_HEIGHT}
                        options={smoothingOptions}
                        selected={smoothingLevel > 0 ? String(smoothingLevel) : SMOOTHING_OFF_OPTION}
                        onValueChange={onSmoothingSelect}
                    />
                    <Text style={styles.smoothingCopy}>
                        {smoothingLevel > 0 ? SMOOTHING_COPY_ON : SMOOTHING_COPY_OFF}
                    </Text>
                    {!!smoothingDetailText && (
                        <Text style={styles.smoothingCopyMuted}>
                            {smoothingDetailText}
                        </Text>
                    )}
                </View>
            )}

            <View style={compact ? styles.switchGrid : styles.switchGridFull}>
                {showLoopOverwrite && (
                    <BinarySelect
                        label="Stop at end of loop"
                        labelPosition="before"
                        value={data.loopOverwrite ?? false}
                        onValueChange={onLoopOverwriteChange}
                    />
                )}
                {showNextOverwrite && (
                    <BinarySelect
                        label="Stop at end of movie"
                        labelPosition="before"
                        value={data.nextOverwrite ?? false}
                        onValueChange={onNextOverwriteChange}
                    />
                )}
                {data.prevRides && (
                    <BinarySelect
                        label="Compare prev rides"
                        labelPosition="before"
                        value={data.showPrev ?? false}
                        onValueChange={onShowPrevChange}
                    />
                )}
            </View>
        </>
    );
};

export const RouteDetailsView = (props: RouteDetailsViewProps) => {
    const {
        title, compact, hasGpx, points, previewUrl, routeData, isOnline, totalDistance,
        totalElevation, routeType, canStart, canNotStartReason,
        showLoopOverwrite, showNextOverwrite, loading,
        initialSettings, segments, prevRides, showPrev: initialShowPrev,
        downloadButtonPrimary,
        attachedWorkout,
        smoothingAvailable, smoothingMaxLevel, smoothedPoints, smoothedElevation, smoothedGradient,
        onStart, onCancel, onAddWorkout, onClearWorkout, onSettingsChanged, onUpdateStartPos,
        downloadButtonLabel, downloadButtonDisabled, onDownloadPress,
        showDownloadModal, onDownloadModalClose, downloadRows,
        onDownloadStop, onDownloadRetry, onDownloadDelete
    } = props;

    const { logEvent } = useLogging('RouteDetailsView');
    const [data, setData] = useState<UIRouteSettings>(initialSettings);
    // Kept out of `data` on purpose: `data` is the settings the user is about to start with, and
    // the preview is a derived read, not a setting. Seeded from the props so a route with a level
    // already stored shows its smoothed profile on open, before the control is touched.
    const [preview, setPreview] = useState<SmoothingPreviewProps>({ smoothedPoints, smoothedElevation, smoothedGradient });
    const [smoothingBusy, setSmoothingBusy] = useState(false);
    const refMounted = useRef(true);
    useUnmountEffect(() => { refMounted.current = false; });

    const converter = useUnitConverter();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    useEffect(() => {
        setData(prev => ({ ...prev, prevRides, showPrev: initialShowPrev }));
    }, [prevRides, initialShowPrev]);

    // The route details load after the dialog opens, so a stored level's preview can arrive late.
    useEffect(() => {
        setPreview({ smoothedPoints, smoothedElevation, smoothedGradient });
    }, [smoothedPoints, smoothedElevation, smoothedGradient]);

    const handleApplySettings = useCallback(async (updated: UIRouteSettings) => {
        setData(updated); // Optimistic update
        const result = await onSettingsChanged(updated);
        if (refMounted.current && result) {
            // The preview is derived data rather than a setting, so it is split back out here
            // instead of being merged into the settings that Start will be given.
            const { smoothedPoints: previewPoints, smoothedElevation: previewElevation, smoothedGradient: previewGradient, ...settings } = result;
            setData(prev => ({ ...prev, ...settings })); // Merge service adjustments
            setPreview({ smoothedPoints: previewPoints, smoothedElevation: previewElevation, smoothedGradient: previewGradient });
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
                startPos: { value: converter.convert(Number(seg.start), 'distance', { from: 'm', to: data.startPos?.unit ?? 'km' })??Number(seg.start), unit: data.startPos?.unit ?? 'km' },
                endPos: { value: converter.convert(Number(seg.end), 'distance', { from: 'm', to: data.startPos?.unit ?? 'km' })??Number(seg.end), unit: data.startPos?.unit ?? 'km' }
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

    // Local-only: unlike the other handlers above, this must not round-trip through
    // onSettingsChanged (refreshPrevRides) - that re-queries past activities for the current
    // position and always recomputes showPrev from whether results exist, clobbering the
    // user's explicit choice right back to "on". Toggling display doesn't change which
    // activities are available, so there's nothing to refresh.
    const handleShowPrevChange = useCallback((v: boolean) => {
        setData(prev => ({ ...prev, showPrev: v }));
    }, []);

    const smoothingLevel = getSmoothingLevel(data);

    // The chip takes effect at once and the profile catches up; while it does, the chart and the
    // figures dim rather than being replaced by a spinner, so the user can keep tapping through
    // levels without the screen jumping.
    const handleSmoothingSelect = useCallback((option: string) => {
        const level = option === SMOOTHING_OFF_OPTION ? 0 : Number(option);
        if (!Number.isFinite(level) || level === smoothingLevel) return;

        setSmoothingBusy(true);
        handleApplySettings({ ...data, smoothingLevel: level })
            .finally(() => { if (refMounted.current) setSmoothingBusy(false); });
    }, [data, smoothingLevel, handleApplySettings]);

    const smoothingOptions = useMemo(() => {
        const max = Math.max(1, Math.round(smoothingMaxLevel ?? SMOOTHING_MAX_LEVEL_FALLBACK));
        return [SMOOTHING_OFF_OPTION, ...Array.from({ length: max }, (_, i) => String(i + 1))];
    }, [smoothingMaxLevel]);


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
        )??distanceMeters;
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

    const {
        hasProfile, showMap, showMapPanel, showProfileStrip, showPreviewColumn,
        mediaRowStyle, mediaBoxSize, graphColumnSize,
    } = computeMediaLayout({ loading, points, routeData, hasGpx, isOnline, previewUrl, screenWidth, screenHeight });

    const smoothedFigure = smoothingLevel > 0 ? preview.smoothedElevation : undefined;
    const smoothingActive = smoothingLevel > 0 && hasProfile && !!preview.smoothedPoints?.length;

    // The graph draws from a whole route record, so the smoothed curve is spliced into a copy of
    // the one already in hand rather than being plumbed through as bare points.
    const smoothedRouteData = useMemo(() => (
        smoothingActive && routeData
            ? { ...routeData, points: preview.smoothedPoints }
            : undefined
    ), [smoothingActive, routeData, preview.smoothedPoints]);

    const gradient = smoothingLevel > 0 ? preview.smoothedGradient : undefined;
    const smoothingBarelyVisible = gradient?.hasVisibleEffect === false;

    const renderMap = () => (
        <FreeMap
            points={points ?? []}
            startPos={0}
            zoom={12}
            draggable={true}
            position={markerPosition}
            onRoutePositionChanged={handleRoutePositionChanged}
        />
    );

    // `showXAxis` is passed by every call site now - live testing showed the strip variants read
    // as broken without a distance scale, outweighing the vertical cost.
    const renderProfile = (showXAxis: boolean) => (
        // The graph sizes itself from its own onLayout, so it needs explicit bounds: the media
        // panel centres its child, which would otherwise collapse it to zero width.
        <View style={styles.profileFill}>
            <ElevationGraph
                routeData={smoothedRouteData ?? routeData}
                pctReality={data.realityFactor}
                showLine={true}
                showColors={true}
                showXAxis={showXAxis}
                showYAxis={false}
                style={smoothingBusy ? styles.recomputing : undefined}
            />
        </View>
    );

    const renderMapSlot = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (showMap) return renderMap();
        return renderProfile(true);
    };

    const renderPreview = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (previewUrl) {
            return <SecureImage source={{ uri: previewUrl }} style={styles.fullMedia} resizeMode="cover" />;
        }
        return <Text style={styles.placeholderText}>No preview available</Text>;
    };

    // Distance and elevation are derived from the route details, so they read as unknown for as
    // long as those are still loading.
    const formatStat = (stat: { value: number, unit: string }, separator = ' ') =>
        loading ? '—' : `${stat.value}${separator}${stat.unit}`;

    // Leads with the gradient figure - the one the rider will feel through the trainer, and the
    // one that moves by a factor rather than by the percent or two elevation gain typically does.
    // Falls back to the elevation-only line (or nothing) if an older service build has no gradient.
    const smoothingDetailText = (() => {
        if (smoothingLevel === 0) return undefined;
        if (smoothingBarelyVisible) return 'This level changes very little on this route — try a higher one.';

        const routeSteepest = Number.isFinite(gradient?.routeSteepest) ? Math.round(gradient!.routeSteepest) : undefined;
        const smoothedSteepest = Number.isFinite(gradient?.smoothedSteepest) ? Math.round(gradient!.smoothedSteepest) : undefined;
        const gradientPart = (routeSteepest !== undefined && smoothedSteepest !== undefined)
            ? `Steepest gradient ${routeSteepest}% → ${smoothedSteepest}%. ` : '';

        if (!smoothedFigure) return gradientPart || undefined;

        return `${gradientPart}This ride records ${formatStat(smoothedFigure)} elevation gain instead of ${formatStat(totalElevation)}.`;
    })();

    // The route's own figure keeps its place and its weight; this is added beside it, never in
    // place of it. A level that changes nothing reads as a zero delta rather than as a warning -
    // the two curves on the chart have already said so.
    const formatSmoothedDelta = (stat: { value: number, unit: string }, separator = ' ') => {
        const delta = Math.round(stat.value - totalElevation.value);
        const sign = delta > 0 ? '+' : MINUS;
        return `${sign}${Math.abs(delta)}${separator}${totalElevation.unit}`;
    };

    const cancelButton = { label: 'Cancel', onClick: onCancel }

    const showAddWorkoutButton = !attachedWorkout;
    const showWorkoutChip = !!attachedWorkout;

    const startButtons = canStart ? [
        { label: 'Start', primary: true, onClick: () => onStart(data) },
        ...(showAddWorkoutButton ? [{ label: 'Add Workout', onClick: () => onAddWorkout(data) }] : [])
    ] : []

    const downloadButton = downloadButtonLabel ? [{
        label: downloadButtonLabel,
        disabled: downloadButtonDisabled,
        onClick: onDownloadPress ?? (() => {}),
        primary: downloadButtonPrimary ?? false,
    }] : []

    const dialogButtons = [cancelButton, ...startButtons, ...downloadButton]

    const workoutChip = showWorkoutChip && attachedWorkout ? (
        <AttachmentChip label="Workout" name={attachedWorkout.title} onClear={onClearWorkout} />
    ) : null;

    // The single compact panel holds the map with the profile beneath it, or - when there is no
    // map to show - the profile on its own, falling back to the still. The split is permanent:
    // nothing here changes size or position as a consequence of the smoothing level, the same
    // invariant the full layout below holds for the still and the strip.
    const renderCompactPanel = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (showMap) {
            return (
                <>
                    <View style={styles.compactMapSlot}>{renderMap()}</View>
                    <View style={styles.compactProfileSlot}>{renderProfile(true)}</View>
                </>
            );
        }
        if (hasProfile) return renderProfile(true);
        return <View style={styles.compactPreviewFallback}>{renderPreview()}</View>;
    };

    if (compact) {
        const showCompactPanel = loading || showMap || hasProfile || !!previewUrl;

        const infoBar = (
            <View style={styles.infoBar}>
                <Text style={[styles.infoBarText, smoothingBusy && styles.recomputing]}>
                    {routeType} • {formatStat(totalDistance, '')} • {formatStat(totalElevation, '')}
                    {/* The only place a second figure fits on this layout, so it is appended to
                        the route's own rather than replacing it. */}
                    {!!smoothedFigure && ` (smoothed ${formatStat(smoothedFigure, '')})`}
                </Text>
                {!!canNotStartReason && <Text style={styles.errorText}>{canNotStartReason}</Text>}
            </View>
        );

        return (
            <Dialog
                title={title}
                variant="full"
                buttons={dialogButtons}
                onOutsideClick={onCancel}
                scrollable={false}
            >
                {workoutChip && <View style={styles.chipWrapper}>{workoutChip}</View>}
                {infoBar}
                <View style={styles.compactRoot}>
                    <View style={styles.compactLeft}>
                        <ScrollView
                            style={styles.compactLeftScroll}
                            contentContainerStyle={styles.compactLeftScrollContent}
                        >
                            <RouteDetailsSettingsForm
                                loading={loading}
                                compact={compact}
                                segments={segments}
                                data={data}
                                totalDistance={totalDistance}
                                smoothingAvailable={smoothingAvailable}
                                smoothingOptions={smoothingOptions}
                                smoothingLevel={smoothingLevel}
                                smoothingDetailText={smoothingDetailText}
                                showLoopOverwrite={showLoopOverwrite}
                                showNextOverwrite={showNextOverwrite}
                                onSegmentSelect={handleSegmentSelect}
                                onStartPosValueChange={handleStartPosValueChange}
                                onRealityFactorChange={handleRealityFactorChange}
                                onSmoothingSelect={handleSmoothingSelect}
                                onLoopOverwriteChange={handleLoopOverwriteChange}
                                onNextOverwriteChange={handleNextOverwriteChange}
                                onShowPrevChange={handleShowPrevChange}
                            />
                        </ScrollView>
                    </View>
                    {showCompactPanel && (
                        <View style={styles.compactRight}>
                            {renderCompactPanel()}
                        </View>
                    )}
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
            {workoutChip && <View style={styles.chipWrapper}>{workoutChip}</View>}
            <View style={mediaRowStyle}>
                {showMapPanel && (
                    // Each box is held to the screen's own aspect ratio and centred in its column,
                    // rather than stretched to the column's shape.
                    <View style={styles.mediaColumnWrapper}>
                        {/* The map (or its loading state) keeps the dark backdrop; a route with no
                            GPX falls back to showing the graph here instead, which stays transparent. */}
                        <View style={[styles.mediaContainer, mediaBoxSize, !showMap && !loading && styles.noBackground]}>
                            {renderMapSlot()}
                        </View>
                    </View>
                )}
                {showPreviewColumn && (
                    <View style={styles.mediaColumnWrapper}>
                        <View style={[styles.mediaContainer, mediaBoxSize]}>{renderPreview()}</View>
                    </View>
                )}
                {showProfileStrip && (
                    // A peer column, not an overlay on the still: sized to whatever width is left
                    // once the map/still boxes are placed (graphColumnSize), full row height, no
                    // aspect-ratio constraint of its own - it's a chart, not something the rider
                    // will see full-screen the way the map/still are.
                    <View style={[styles.graphColumn, graphColumnSize]}>
                        {renderProfile(true)}
                    </View>
                )}
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{formatStat(totalDistance)}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Elevation</Text>
                    <Text style={[styles.statValue, smoothingBusy && styles.recomputing]}>
                        {formatStat(totalElevation)}
                    </Text>
                    {!!smoothedFigure && (
                        <Text style={[styles.statSmoothed, smoothingBusy && styles.recomputing]}>
                            {`smoothed ${formatStat(smoothedFigure)} (${formatSmoothedDelta(smoothedFigure)})`}
                        </Text>
                    )}
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Type</Text>
                    <Text style={styles.statValue}>{routeType}</Text>
                </View>
            </View>
            <View style={styles.settingsArea}>
                <RouteDetailsSettingsForm
                    loading={loading}
                    compact={compact}
                    segments={segments}
                    data={data}
                    totalDistance={totalDistance}
                    smoothingAvailable={smoothingAvailable}
                    smoothingOptions={smoothingOptions}
                    smoothingLevel={smoothingLevel}
                    smoothingDetailText={smoothingDetailText}
                    showLoopOverwrite={showLoopOverwrite}
                    showNextOverwrite={showNextOverwrite}
                    onSegmentSelect={handleSegmentSelect}
                    onStartPosValueChange={handleStartPosValueChange}
                    onRealityFactorChange={handleRealityFactorChange}
                    onSmoothingSelect={handleSmoothingSelect}
                    onLoopOverwriteChange={handleLoopOverwriteChange}
                    onNextOverwriteChange={handleNextOverwriteChange}
                    onShowPrevChange={handleShowPrevChange}
                />
                {!!canNotStartReason && <Text style={styles.fullErrorText}>{canNotStartReason}</Text>}
            </View>
            <DownloadModalView
                visible={!!showDownloadModal}
                rows={downloadRows ?? []}
                nested={true}
                onStop={onDownloadStop ?? (() => {})}
                onRetry={onDownloadRetry ?? (() => {})}
                onDelete={onDownloadDelete ?? (() => {})}
                onClose={onDownloadModalClose ?? (() => {})}
            />
        </Dialog>
    );
};

const styles = StyleSheet.create({
    chipWrapper: { paddingHorizontal: 15 },
    mediaRow: { flexDirection: 'row', gap: 10, padding: 10 },
    // The evenly-split half of the row each media box centres in - sized by flex, not by the box
    // itself, so the box inside can be smaller than its column without the column collapsing.
    mediaColumnWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Sized explicitly per-instance (see mediaBoxSize) to the screen's own aspect ratio, so it
    // never stretches to whatever shape mediaColumnWrapper/mediaRowHeight happen to leave.
    mediaContainer: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    // A peer of mediaColumnWrapper, not nested in it: sized explicitly per-instance (see
    // graphColumnSize) to whatever width is left over, full row height. No background of its own -
    // the graph should read as just the graph, not a dark box next to the map/still.
    graphColumn: { paddingHorizontal: 8, paddingVertical: 6 },
    fullMedia: { width: '100%', height: '100%' },
    profileFill: { width: '100%', height: '100%',backgroundColor: 'rgba(255,255,255,0.0)'},
    noBackground: { backgroundColor: 'transparent' },
    // No spinner: the chip is already selected and the chips stay live, so the dimming is only
    // there to say the curve and the figures are one beat behind the tap.
    recomputing: { opacity: 0.6 },
    placeholderText: { color: colors.disabled, fontSize: 12 },
    formLoading: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 30 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { color: colors.disabled, fontSize: 10, textTransform: 'uppercase' },
    statValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
    // Subordinate to the route's own figure above it, and never struck through it: the route
    // keeps its number, this ride has a different one.
    statSmoothed: { color: colors.disabled, fontSize: 11, marginTop: 2 },
    settingsArea: { padding: 15 },
    inputRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    editNumberWrapper: { flex: 1 },
    smoothingRow: { marginBottom: 15 },
    smoothingCopy: { color: colors.text, fontSize: 12, opacity: 0.8 },
    smoothingCopyMuted: { color: colors.disabled, fontSize: 11, marginTop: 2 },
    switchGrid: { gap: 4 },
    // full only: each toggle is a full labelled ChipSelect at ~46px, not the ~26px iOS-style
    // switch the mockups assumed - stacked, three of them cost 138px this form doesn't have.
    // Wrapping lets 2-3 share a row on any real tablet width instead of stacking or clipping.
    switchGridFull: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 28, rowGap: 4 },
    // flex: 1 lets compactRoot fill whatever's left of Dialog's definite-height content area
    // (scrollable=false -> View with flexGrow: 1, instead of a height-agnostic ScrollView) after
    // `infoBar` - rendered as a plain sibling before compactRoot, see the compact branch above -
    // takes its own natural height. That makes compactRight's height: '100%' map resolve against
    // real available space and shrink/grow per viewport, instead of just hugging compactLeft's
    // natural content height.
    compactRoot: { flexDirection: 'row', padding: 10, gap: 15, flex: 1, minHeight: 0 },
    // minHeight: 0 + overflow: 'hidden' counter CSS flexbox's default min-height: auto (a flex
    // item won't shrink below its content's intrinsic size unless told to) - without it, on
    // react-native-web the inner ScrollView's tall content pushes compactLeft past compactRoot's
    // real height instead of clipping/scrolling within it, visually overlapping the footer below.
    // Native Yoga doesn't default to min-height: auto, but setting this explicitly is harmless
    // there and keeps behaviour identical across platforms.
    compactLeft: { flex: 1, minHeight: 0, overflow: 'hidden' },
    compactLeftScroll: { flex: 1 },
    compactLeftScrollContent: { paddingBottom: 4 },
    // No background of its own - see compactMapSlot/compactPreviewFallback, which carry it only
    // when there is a map or still to frame; a lone profile leaves this fully transparent.
    compactRight: { width: '35%', borderRadius: 6, overflow: 'hidden' },
    // Phone landscape has room for one panel only, so map and profile share it. Both halves are
    // small; the alternative - profile on tablets only - is a worse answer to the same shortage.
    compactMapSlot: { height: '65%', backgroundColor: 'rgba(0,0,0,0.3)' },
    compactProfileSlot: { height: '35%', paddingHorizontal: 6, paddingVertical: 4 },
    // Used only when the compact panel falls back to the still alone (no map, no profile) - the
    // one case here where compactRight itself needs a backdrop.
    compactPreviewFallback: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    infoBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        alignItems: 'center',
        // Rendered as the first child inside Dialog's content area (see the compact branch
        // above), directly below the header - a bottom border separates it from the form/map
        // content that follows, rather than a top border (which would sit redundantly close to
        // the header's own border-bottom).
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    infoBarText: { color: colors.disabled, fontSize: 14 },
    errorText: { color: colors.error, fontSize: 16, fontWeight: '700', marginTop: 4, textAlign: 'center' },
    fullErrorText: { color: colors.error, fontSize: 13, marginTop: 10, textAlign: 'center' },
});