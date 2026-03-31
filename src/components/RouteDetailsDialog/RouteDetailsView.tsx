import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    // TouchableOpacity, // Not directly used for chip/dropdown anymore, but keep for other elements
    // TextInput, // REMOVED
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import type { UIRouteSettings, FormattedNumber, UIStartSettings } from 'incyclist-services'; // Added UIStartSettings
import { useUnitConverter } from 'incyclist-services';
import { RouteDetailsViewProps } from './types';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { colors } from '../../theme';
import { useLogging, useUnmountEffect } from '../../hooks'; // Added useUnmountEffect
import { BinarySelect } from '../BinarySelect';
import { EditNumber } from '../EditNumber'; // NEW
import { ChipSelect } from '../ChipSelect'; // NEW
import { SingleSelect } from '../SingleSelect'; // NEW

const SEGMENT_CHIP_THRESHOLD = 5;

export const RouteDetailsView = (props: RouteDetailsViewProps) => {
    const {
        title, compact, hasGpx, points, previewUrl, totalDistance,
        totalElevation, routeType, canStart, canNotStartReason,
        showLoopOverwrite, showNextOverwrite, showWorkout, loading,
        initialSettings, segments, prevRides, showPrev: initialShowPrev,
        onStart, onCancel, onStartWithWorkout, onSettingsChanged, onUpdateStartPos
    } = props;

    const { logEvent } = useLogging('RouteDetailsView');
    const [data, setData] = useState<UIRouteSettings>(initialSettings);
    const refMounted = useRef(true); // NEW: To guard async setState calls
    useUnmountEffect(() => { refMounted.current = false; }); // NEW: Clean up ref on unmount

    const converter = useUnitConverter();

    // REMOVED: val, startPosInput, realityInput, segmentDropdownOpen, segmentTriggerHeight states
    // REMOVED: useEffect for initialized, and for syncing startPosInput/realityInput

    useEffect(() => {
        setData(prev => ({ ...prev, prevRides, showPrev: initialShowPrev }));
    }, [prevRides, initialShowPrev]);

    const handleApplySettings = useCallback(async (updated: UIRouteSettings) => { // Made async
        setData(updated); // Optimistic update
        const result = await onSettingsChanged(updated); // Await service response
        if (refMounted.current && result) { // Guard against unmounted component
            setData(prev => ({ ...prev, ...result })); // Merge service adjustments
        }
    }, [onSettingsChanged]);

    const handleSegmentSelect = (segName: string) => {
        logEvent({ message: 'option selected', field: 'segment', value: segName, eventSource: 'user' });
        // REMOVED: setSegmentDropdownOpen(false);
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
    };

    // REMOVED: handleStartPosBlur, handleRealityBlur

    const renderMedia = () => {
        if (loading) return <ActivityIndicator color={colors.text} />;
        if (hasGpx && points?.length) {
            return <FreeMap points={points} startPos={0} zoom={12} />;
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

    // REMOVED: renderSegmentChips and renderSegmentDropdown

    const renderForm = () => {
        const useChips = !compact && (segments?.length ?? 0) <= SEGMENT_CHIP_THRESHOLD;

        return (
            <>
                {segments && segments.length > 0 && (
                    useChips ? (
                        <ChipSelect // NEW: ChipSelect for segments
                            label=''
                            labelWidth={0}
                            options={['All', ...segments.map(s => s.name)]}
                            selected={data.segment ?? 'All'}
                            onValueChange={handleSegmentSelect}
                        />
                    ) : (
                        <SingleSelect // NEW: SingleSelect for segments
                            label='Segment'
                            options={['All', ...segments.map(s => s.name)]}
                            selected={data.segment ?? 'All'}
                            onValueChange={handleSegmentSelect}
                        />
                    )
                )}
                <View style={styles.inputRow}>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber // NEW: EditNumber for startPos
                            label='Start'
                            unit={data.startPos?.unit ?? 'km'}
                            value={data.startPos?.value ?? 0}
                            min={0}
                            max={totalDistance.value}
                            digits={1}
                            onValueChange={(value) => {
                                const result = onUpdateStartPos(value ?? 0);
                                if (result) {
                                    handleApplySettings({ ...data, ...result });
                                } else {
                                    // If service returns null, apply user input directly
                                    handleApplySettings({
                                        ...data,
                                        startPos: { value: value ?? 0, unit: data.startPos?.unit ?? 'km' }
                                    });
                                }
                            }}
                        />
                    </View>
                    <View style={styles.editNumberWrapper}>
                        <EditNumber // NEW: EditNumber for realityFactor
                            label='Reality'
                            unit='%'
                            value={data.realityFactor ?? 100}
                            min={0}
                            max={100}
                            digits={0}
                            onValueChange={(value) => handleApplySettings({ ...data, realityFactor: value ?? 100 })}
                        />
                    </View>
                </View>

                {data.endPos !== undefined && ( // NEW: Conditional row for endPos
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
                    </View>
                )}

                <View style={styles.switchGrid}>
                    {showLoopOverwrite && (
                        <BinarySelect
                            label="Stop at end of loop"
                            labelPosition="before"
                            value={data.loopOverwrite ?? false}
                            onValueChange={(v) => handleApplySettings({ ...data, loopOverwrite: v })}
                        />
                    )}
                    {showNextOverwrite && (
                        <BinarySelect
                            label="Stop at end of movie"
                            labelPosition="before"
                            value={data.nextOverwrite ?? false}
                            onValueChange={(v) => handleApplySettings({ ...data, nextOverwrite: v })}
                        />
                    )}
                    {data.prevRides && (
                        <BinarySelect
                            label="Compare prev rides"
                            labelPosition="before"
                            value={data.showPrev ?? false}
                            onValueChange={(v) => handleApplySettings({ ...data, showPrev: v })}
                        />
                    )}
                </View>
            </>
        );
    };

    const dialogButtons = [
        { label: 'Cancel', onClick: onCancel },
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
            </Dialog>
        );
    }

    return (
        <Dialog title={title} variant="full" buttons={dialogButtons} onOutsideClick={onCancel}>
            <View style={styles.mediaRow}>
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
        </Dialog>
    );
};

const styles = StyleSheet.create({
    mediaRow: { flexDirection: 'row', height: 180, gap: 10, padding: 10 },
    mediaContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    fullMedia: { width: '100%', height: '100%' },
    placeholderText: { color: colors.disabled, fontSize: 12 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { color: colors.disabled, fontSize: 10, textTransform: 'uppercase' },
    statValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
    settingsArea: { padding: 15 },
    // REMOVED: segmentScroll
    // REMOVED: chip, chipActive, chipText
    inputRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    editNumberWrapper: { flex: 1 }, // NEW: Wrapper for EditNumber to allow flex:1 layout
    // REMOVED: inputGroup
    // REMOVED: inputLabel
    // REMOVED: textInput
    switchGrid: { gap: 4 },
    compactRoot: { flexDirection: 'row', padding: 10, gap: 15 },
    compactLeft: { flex: 1 },
    compactRight: { width: '35%', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, overflow: 'hidden' },
    infoBar: { paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center' },
    infoBarText: { color: colors.disabled, fontSize: 12 },
    errorText: { color: colors.error, fontSize: 11, marginTop: 4 },
    fullErrorText: { color: colors.error, fontSize: 13, marginTop: 10, textAlign: 'center' },
    // REMOVED: dropdownContainer, segmentDropdownTrigger, segmentDropdownText, segmentDropdownArrow, segmentDropdownList, dropdownScroll, segmentDropdownItem, segmentDropdownItemText
});