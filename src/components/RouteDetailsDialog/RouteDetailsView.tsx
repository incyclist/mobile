import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import type { UIRouteSettings, FormattedNumber } from 'incyclist-services';
import { useUnitConverter } from 'incyclist-services';
import { RouteDetailsViewProps } from './types';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { colors } from '../../theme';
import { useLogging } from '../../hooks';
import { BinarySelect } from '../BinarySelect';

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
    const [initialized, setInitialized] = useState(false);
    const converter = useUnitConverter();

    const val = useCallback(( (v:number|FormattedNumber|undefined, defValue?:number)=> {


        const getVal = ()=> {
        if (typeof v==='number' )
            return v.toString()
        if (typeof v==='object' && v !== null && 'value' in v && v.value!==undefined)
            return v.value.toString()
        if (v === undefined || v === null || (typeof v === 'object' && !('value' in v)))
            return (defValue!==undefined) ? defValue.toString(): ''
         return ''
        }

        const res = getVal() 
        console.log('# val', v, defValue, '->' ,res)

        return res
    }),[]);

    // Input and Dropdown States
    const [startPosInput, setStartPosInput] = useState(val(initialSettings?.startPos,0));
    const [realityInput, setRealityInput] = useState(val(initialSettings?.realityFactor,100));
    const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
    const [segmentTriggerHeight, setSegmentTriggerHeight] = useState(0);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);

            console.log('# init effect', initialSettings)
            setData(initialSettings);
            setStartPosInput(val(initialSettings?.startPos,0));
            setRealityInput(val(initialSettings?.realityFactor,100));
        }
    }, [initialized, initialSettings, val]);

    useEffect(() => {
        setData(prev => ({ ...prev, prevRides, showPrev: initialShowPrev }));
    }, [prevRides, initialShowPrev]);

    useEffect(() => {
        setStartPosInput( val(data?.startPos,0));
    }, [data?.startPos, val]);

    useEffect(() => {
        setRealityInput( val(data?.realityFactor,100));
    }, [data.realityFactor, val]);

    const handleApplySettings = useCallback((updated: UIRouteSettings) => {
        setData(updated);
        onSettingsChanged(updated);
    }, [onSettingsChanged]);

    const handleSegmentSelect = (segName: string) => {
        logEvent({ message: 'option selected', field: 'segment', value: segName, eventSource: 'user' });
        setSegmentDropdownOpen(false);
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

    const handleStartPosBlur = (valStr: string) => {
        const parsed = parseFloat(valStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed)) {
            logEvent({ message: 'text entered', field: 'startPos', value: parsed, eventSource: 'user' });
            const result = onUpdateStartPos(parsed??0);
            if (result) handleApplySettings({ ...data, ...result });
        }
    };

    const handleRealityBlur = (valStr: string) => {
        const parsed = Math.min(100, Math.max(0, parseFloat(valStr.replace(/[^0-9.]/g, ''))));
        if (!isNaN(parsed)) {
            logEvent({ message: 'text entered', field: 'realityFactor', value: parsed, eventSource: 'user' });
            handleApplySettings({ ...data, realityFactor: parsed??100 });
        }
    };

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

    const renderSegmentChips = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentScroll}>
            <TouchableOpacity
                style={[styles.chip, !data.segment && styles.chipActive]}
                onPress={() => handleSegmentSelect('All')}
            >
                <Text style={styles.chipText}>All</Text>
            </TouchableOpacity>
            {segments!.map(s => (
                <TouchableOpacity
                    key={s.name}
                    style={[styles.chip, data.segment === s.name && styles.chipActive]}
                    onPress={() => handleSegmentSelect(s.name)}
                >
                    <Text style={styles.chipText}>{s.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderSegmentDropdown = () => (
        <View style={styles.dropdownContainer}>
            <Text style={styles.inputLabel}>Segment</Text>
            <TouchableOpacity
                style={styles.segmentDropdownTrigger}
                onLayout={(e) => setSegmentTriggerHeight(e.nativeEvent.layout.height)}
                onPress={() => setSegmentDropdownOpen(o => !o)}
            >
                <Text style={styles.segmentDropdownText}>{data.segment || 'All'}</Text>
                <Text style={styles.segmentDropdownArrow}>{segmentDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {segmentDropdownOpen && (
                <View style={[styles.segmentDropdownList, { top: segmentTriggerHeight }]}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {['All', ...segments!.map(s => s.name)].map((name) => (
                            <TouchableOpacity
                                key={name}
                                style={styles.segmentDropdownItem}
                                onPress={() => handleSegmentSelect(name)}
                            >
                                <Text style={styles.segmentDropdownItemText}>{name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const renderForm = () => {
        const useChips = !compact && (segments?.length ?? 0) <= SEGMENT_CHIP_THRESHOLD;

        return (
            <>
                {segments && segments.length > 0 && (
                    useChips ? renderSegmentChips() : renderSegmentDropdown()
                )}
                <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Start at ({data.startPos?.unit ?? 'm'}):</Text>
                        <TextInput 
                            style={styles.textInput} 
                            keyboardType="numeric"
                            value={startPosInput}
                            onChangeText={setStartPosInput}
                            onBlur={() => handleStartPosBlur(startPosInput)}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Reality Factor (%):</Text>
                        <TextInput 
                            style={styles.textInput} 
                            keyboardType="numeric"
                            value={realityInput}
                            onChangeText={setRealityInput}
                            onBlur={() => handleRealityBlur(realityInput)}
                        />
                    </View>
                </View>
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
    segmentScroll: { marginBottom: 15 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
    chipActive: { backgroundColor: colors.buttonPrimary },
    chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
    inputRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    inputGroup: { flex: 1, gap: 4 },
    inputLabel: { color: colors.text, fontSize: 12, opacity: 0.8 },
    textInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#555', borderRadius: 4, color: '#FFF', paddingHorizontal: 10, height: 36, fontSize: 14 },
    switchGrid: { gap: 4 },
    compactRoot: { flexDirection: 'row', padding: 10, gap: 15 },
    compactLeft: { flex: 1 },
    compactRight: { width: '35%', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 6, overflow: 'hidden' },
    infoBar: { paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center' },
    infoBarText: { color: colors.disabled, fontSize: 12 },
    errorText: { color: colors.error, fontSize: 11, marginTop: 4 },
    fullErrorText: { color: colors.error, fontSize: 13, marginTop: 10, textAlign: 'center' },
    dropdownContainer: { position: 'relative', marginBottom: 15, zIndex: 100 },
    segmentDropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        paddingHorizontal: 10,
        height: 36,
    },
    segmentDropdownText: { color: colors.text, fontSize: 13 },
    segmentDropdownArrow: { color: colors.text, fontSize: 10 },
    segmentDropdownList: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 4,
        zIndex: 1000,
        elevation: 10,
    },
    dropdownScroll: { maxHeight: 200 },
    segmentDropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    segmentDropdownItemText: { color: colors.text, fontSize: 13 },
});