import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { formatTime, useUnitConverter } from 'incyclist-services';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { ActivityGraph } from '../ActivityGraph';
import { ActivitySummaryDialogViewProps, isFormattedNumber } from './types';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';

const safeNum = (v: any): number | undefined => {
    try {
        if (v === undefined || v === null) return undefined;
        if (typeof v === 'object' && 'value' in v) return (v as { value: number }).value;
        if (typeof v === 'number') return v;
    }
    catch {} 
    return undefined
};

export const ActivitySummaryDialogView = (props: ActivitySummaryDialogViewProps) => {
    const {
        activity,
        showMap,
        showSave,
        preview,
        units,
        isSaving,
        isSaved,
        showDeleteConfirm,
        onSave,
        onClose,
        onDelete,
        onDeleteConfirm,
        onDeleteCancel,
        onShareFile,
        compact,
    } = props;

    const layout = useScreenLayout();
    const isCompact = compact ?? layout === 'compact';
    const converter = useUnitConverter();

    const dialogButtons = isSaved
        ? [{ label: 'Close', onClick: onClose, primary: true }]
        : [
            ...(showSave ? [{
                label: isSaving ? 'Saving...' : 'Save',
                onClick: onSave,
                primary: true,
                disabled: isSaving,
            }] : []),
            { label: 'Delete', onClick: onDelete },
            { label: 'Close', onClick: onClose },
        ];

    const renderKeyFact = (label: string, value: any, unitKey?: 'distance' | 'elevation' | 'speed' | 'time' | 'power') => {
        let displayValue: string;
        let displayUnit: string = '';

        if (isFormattedNumber(value)) {
            displayValue = value.value.toFixed(1);
            displayUnit = value.unit;
        } else if (typeof value === 'number') {
            if (unitKey === 'distance') {
                displayValue = converter.convert(value, 'distance', { from: 'm' }).toFixed(1);
                displayUnit = converter.getUnit('distance');
            } else if (unitKey === 'elevation') {
                displayValue = Math.round(converter.convert(value, 'elevation', { from: 'm' })).toString();
                displayUnit = converter.getUnit('elevation');
            } else if (unitKey === 'time') {
                displayValue = formatTime(value as number, true);
            } else if (unitKey === 'power') {
                displayValue = value.toFixed(0);
                displayUnit = 'W';
            } else {
                displayValue = value.toFixed(1);
            }
        } else if (typeof value === 'string' && value) {
            displayValue = value;
        } else {
            displayValue = '--';
        }

        return (
            <View style={styles.keyFactItem}>
                <Text style={styles.keyFactLabel}>{label}</Text>
                <Text style={styles.keyFactValue}>{displayValue}<Text style={styles.keyFactUnit}> {displayUnit}</Text></Text>
            </View>
        );
    };

    const renderTableHeader = () => (
        <View style={styles.metricTableHeaderRow}>
            <Text style={styles.metricTableHeaderCell} />
            <Text style={styles.metricTableHeaderCell}>Average</Text>
            <Text style={styles.metricTableHeaderCell}>Min</Text>
            <Text style={styles.metricTableHeaderCell}>Max</Text>
        </View>
    );

    const renderMetricRow = (label: string, stats: any, defaultUnit: string | undefined, compactMode: boolean) => {
        if (!stats) return null;

        let avgValue: string = '--';
        let minValue: string = '--';
        let maxValue: string = '--';
        let currentDisplayUnit: string | undefined = defaultUnit;

        try {
            const avg = safeNum(stats.avg);
            const min = safeNum(stats.min);
            const max = safeNum(stats.max);

            if (label === 'Speed') {
                currentDisplayUnit = converter.getUnit('speed');
                avgValue = avg !== undefined ? converter.convert(avg, 'speed', { from: 'km/h' }).toFixed(1) : '--';
                minValue = min !== undefined ? converter.convert(min, 'speed', { from: 'km/h' }).toFixed(1) : '--';
                maxValue = max !== undefined ? converter.convert(max, 'speed', { from: 'km/h' }).toFixed(1) : '--';
            } else {
                avgValue = avg !== undefined ? avg.toFixed(1) : '--';
                minValue = min !== undefined ? min.toFixed(0) : '--';
                maxValue = max !== undefined ? max.toFixed(0) : '--';
            }
        } catch {
            // leave defaults ('--') if anything goes wrong
        }

        if (compactMode) {
            return (
                <View style={styles.metricRowCompact}>
                    <Text style={styles.metricLabelCompact}>{label}</Text>
                    <Text style={styles.metricAvgCompact}>{avgValue}<Text style={styles.metricUnitCompact}> {currentDisplayUnit}</Text></Text>
                </View>
            );
        } else {
            return (
                <View style={styles.metricTableRow}>
                    <Text style={styles.metricTableCell}>{label}</Text>
                    <Text style={styles.metricTableCell}>{avgValue}</Text>
                    <Text style={styles.metricTableCell}>{minValue}</Text>
                    <Text style={styles.metricTableCell}>{maxValue}<Text style={styles.metricUnitTable}> {currentDisplayUnit}</Text></Text>
                </View>
            );
        }
    };

    const FileChip = ({ label, path }: { label: string; path?: string | null }) => {
        const disabled = !path;
        return (
            <TouchableOpacity
                disabled={disabled}
                onPress={() => path && onShareFile(path)}
                style={[styles.chip, disabled && styles.chipDisabled]}
            >
                <Text style={styles.chipText}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const mapPoints = (activity.logs?.filter(l => l.lat != null && l.lng != null && l.lat !== undefined && l.lng !== undefined) ?? []).map(l => ({
        lat: l.lat as number,
        lng: l.lng as number,
        routeDistance: l.distance ?? 0,
        elevation: l.elevation ?? 0,
    }));

    const StatsContent = (
        <View style={styles.statsContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
                <View style={styles.chipsRow}>
                    <FileChip label="JSON" path={activity.fileName} />
                    <FileChip label="TCX" path={activity.tcxFileName} />
                    <FileChip label="FIT" path={activity.fitFileName} />
                </View>
            </View>

            <Text style={styles.startTime}>{new Date(activity.startTime).toLocaleString()}</Text>

            <View style={styles.keyFactsSection}>
                {renderKeyFact('Distance', activity.distance, 'distance')}
                {renderKeyFact('Duration', activity.time, 'time')}
                {renderKeyFact('Elevation', activity.totalElevation, 'elevation')}
                {renderKeyFact('Power Weighted', activity.stats?.power?.weighted, 'power')}
            </View>

            <View style={styles.metricsTableSection}>
                {!isCompact && renderTableHeader()}
                {renderMetricRow('Speed', activity.stats?.speed, units?.speed, isCompact)}
                {renderMetricRow('Power', activity.stats?.power, 'W', isCompact)}
                {renderMetricRow('Heart Rate', activity.stats?.hrm, 'bpm', isCompact)}
                {renderMetricRow('Cadence', activity.stats?.cadence, 'rpm', isCompact)}
            </View>
        </View>
    );

    const GraphContent = (
        <ErrorBoundary>
            <View style={styles.graphContainer}>
                <ActivityGraph
                    activity={activity}
                    units={units as Record<string, string>}
                />                
            </View>
        </ErrorBoundary>
    );

    const MapPreview = (
        <View style={isCompact ? styles.compactMapContainer : styles.mapContainer}>
            {showMap ? (
                <FreeMap points={mapPoints} style={styles.map} />
            ) : preview ? (
                <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
            ) : (
                <View style={styles.emptyPreview} />
            )}
        </View>
    );

    const MainContent = isCompact ? (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {StatsContent}
            {(showMap || preview) && MapPreview}
            {GraphContent}
        </ScrollView>
    ) : (
        <View style={styles.normalContainer}>
            <View style={styles.topRow}>
                {(showMap || preview) && MapPreview}
                <View style={styles.statsWrapper}>
                    {StatsContent}
                </View>
            </View>
            {GraphContent}
        </View>
    );

    return (
        <Dialog
            variant="full"
            title="Ride Summary"
            buttons={dialogButtons}
        >
            {MainContent}

            {showDeleteConfirm && (
                <View style={styles.deleteConfirmWrapper}>
                    <Dialog
                        variant="info"
                        title="Delete Ride"
                        buttons={[
                            { label: 'Cancel', onClick: onDeleteCancel },
                            { label: 'Delete', onClick: onDeleteConfirm, attention: true },
                        ]}
                        onOutsideClick={onDeleteCancel}
                    >
                        <Text style={styles.confirmText}>This will permanently delete this ride. Are you sure?</Text>
                    </Dialog>
                </View>
            )}
        </Dialog>
    );
};

const styles = StyleSheet.create({
    normalContainer: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        height: 400,
        marginBottom: 16,
    },
    mapContainer: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    compactMapContainer: {
        height: 150,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginBottom: 16,
        marginTop: 16,
    },
    map: {
        flex: 1,
    },
    previewImage: {
        flex: 1,
    },
    emptyPreview: {
        flex: 1,
    },
    statsWrapper: {
        flex: 1,
        paddingLeft: 16,
    },
    statsContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        flex: 1,
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: 'bold',
        marginRight: 8,
    },
    startTime: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        marginBottom: 12,
    },
    keyFactsSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    keyFactItem: {
        width: '48%',
        marginBottom: 4,
    },
    keyFactLabel: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
        textTransform: 'capitalize',
    },
    keyFactValue: {
        fontSize: textSizes.normalText,
        color: colors.text,
        fontWeight: '600',
    },
    keyFactUnit: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
    },
    metricsTableSection: {
        marginTop: 8,
    },
    metricTableHeaderRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 4,
    },
    metricTableHeaderCell: {
        flex: 1,
        fontSize: textSizes.smallText,
        color: colors.disabled,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    metricTableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    metricTableCell: {
        flex: 1,
        fontSize: textSizes.normalText,
        color: colors.text,
        textAlign: 'center',
    },
    metricUnitTable: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
    },
    metricRowCompact: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    metricLabelCompact: {
        flex: 1,
        fontSize: textSizes.normalText,
        color: colors.text,
        textTransform: 'capitalize',
    },
    metricAvgCompact: {
        flex: 1,
        fontSize: textSizes.normalText,
        color: colors.text,
        fontWeight: '600',
        textAlign: 'right',
    },
    metricUnitCompact: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: colors.tileActive,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    chipDisabled: {
        opacity: 0.5,
    },
    chipText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: 'bold',
    },
    graphContainer: {
        flex: 1,
        width: '100%',
        marginTop: 16,
        minHeight: 200, // Added minHeight
    },
    confirmText: {
        fontSize: textSizes.normalText,
        color: colors.text,
        padding: 16,
        textAlign: 'center',
    },
    deleteConfirmWrapper: { // Added style for delete confirmation wrapper
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        overflow: 'hidden',
    },
});