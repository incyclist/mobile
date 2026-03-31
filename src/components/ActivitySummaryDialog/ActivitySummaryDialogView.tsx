import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { formatTime } from 'incyclist-services';
import { Dialog } from '../Dialog';
import { FreeMap } from '../FreeMap';
import { ActivityGraph } from '../ActivityGraph';
import { ActivitySummaryDialogViewProps, isFormattedNumber } from './types';
import { colors, textSizes } from '../../theme';
import { useScreenLayout } from '../../hooks';

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

    const dialogButtons = [
        ...(showSave ? [{
            label: 'Save',
            onClick: onSave,
            primary: true,
            disabled: isSaving || isSaved,
        }] : []),
        {
            label: 'Delete',
            onClick: onDelete,
        },
        {
            label: isSaving ? 'Saving...' : 'Close',
            onClick: onClose,
        },
    ];

    const renderSimpleStat = (label: string, value: any, fallbackUnit: string = '') => {
        let displayValue = '--';
        let displayUnit = fallbackUnit;

        if (isFormattedNumber(value)) {
            displayValue = value.value.toFixed(1);
            displayUnit = value.unit;
        } else if (value !== undefined && value !== null) {
            displayValue = value.toString();
        }

        return (
            <View style={styles.statItemSimple}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>
                    {displayValue}
                    <Text style={styles.statUnit}> {displayUnit}</Text>
                </Text>
            </View>
        );
    };

    const renderMetricStat = (label: string, stats: any, unit: string = '') => {
        if (!stats) return null;
        
        const avgValue = stats.avg;
        const minValue = stats.min;
        const maxValue = stats.max;

        const avg = avgValue !== undefined ? avgValue.toFixed(1) : '--';
        const min = minValue !== undefined ? minValue.toFixed(0) : '0';
        const max = maxValue !== undefined ? maxValue.toFixed(0) : '0';

        return (
            <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={styles.metricAvg}>
                    {avg} <Text style={styles.statUnit}>{unit}</Text>
                </Text>
                <Text style={styles.metricMinMax}>min: {min}  max: {max}</Text>
            </View>
        );
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
            
            <View style={styles.simpleStatsRow}>
                {renderSimpleStat('Distance', activity.distance)}
                {renderSimpleStat('Elevation', activity.totalElevation)}
                {renderSimpleStat('Duration', formatTime(activity.time, true))}
            </View>

            <View style={styles.metricsContainer}>
                {renderMetricStat('Avg Speed', activity.stats?.speed, units?.speed)}
                {renderMetricStat('Avg Power', activity.stats?.power, 'W')}
                {renderMetricStat('Avg HR', activity.stats?.hrm, 'bpm')}
                {renderMetricStat('Avg Cadence', activity.stats?.cadence, 'rpm')}
            </View>
        </View>
    );

    const GraphContent = (
        <View style={styles.graphContainer}>
            <ActivityGraph
                activity={activity}
                units={{ speed: units?.speed, distance: units?.distance }}
                style={styles.graph}
            />
        </View>
    );

    const MainContent = isCompact ? (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {StatsContent}
            {GraphContent}
        </ScrollView>
    ) : (
        <View style={styles.normalContainer}>
            <View style={styles.topRow}>
                <View style={styles.mapContainer}>
                    {showMap ? (
                        <FreeMap style={styles.map} />
                    ) : preview ? (
                        <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.emptyPreview} />
                    )}
                </View>
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
        height: 200,
        marginBottom: 16,
    },
    mapContainer: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.2)',
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
    simpleStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItemSimple: {
        flex: 1,
    },
    metricsContainer: {
        gap: 4,
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    metricLabel: {
        flex: 2,
        fontSize: textSizes.smallText,
        color: colors.disabled,
        textTransform: 'uppercase',
    },
    metricAvg: {
        flex: 2,
        fontSize: textSizes.normalText,
        color: colors.text,
        fontWeight: '600',
    },
    metricMinMax: {
        flex: 3,
        fontSize: textSizes.smallText,
        color: colors.disabled,
        textAlign: 'right',
    },
    statLabel: {
        fontSize: textSizes.smallText,
        color: colors.disabled,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: textSizes.normalText,
        color: colors.text,
    },
    statUnit: {
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
        height: 200,
        width: '100%',
        marginTop: 16,
    },
    graph: {
        flex: 1,
    },
    confirmText: {
        fontSize: textSizes.normalText,
        color: colors.text,
        padding: 16,
        textAlign: 'center',
    },
});