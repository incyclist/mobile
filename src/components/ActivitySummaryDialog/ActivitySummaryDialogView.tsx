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
    } = props;

    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    const dialogButtons = [
        ...(showSave ? [{
            label: 'Save',
            onPress: onSave,
            primary: true,
            disabled: isSaving || isSaved,
        }] : []),
        {
            label: 'Delete',
            onPress: onDelete,
        },
        {
            label: isSaving ? 'Saving...' : 'Close',
            onPress: onClose,
        },
    ];

    const renderStat = (label: string, value: any, fallbackUnit: string = '') => {
        let displayValue = '--';
        let displayUnit = fallbackUnit;

        if (isFormattedNumber(value)) {
            displayValue = value.value.toString();
            displayUnit = value.unit;
        } else if (value !== undefined && value !== null) {
            displayValue = value.toString();
        }

        return (
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>
                    {displayValue}
                    <Text style={styles.statUnit}> {displayUnit}</Text>
                </Text>
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
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.startTime}>{new Date(activity.startTime).toLocaleString()}</Text>
            
            <View style={styles.statsGrid}>
                {renderStat('Distance', activity.distance)}
                {renderStat('Elevation', activity.totalElevation)}
                {renderStat('Duration', formatTime(activity.time, true))}
                {renderStat('Avg Speed', activity.stats?.speed?.avg, units?.speed)}
                {renderStat('Avg Power', activity.stats?.power?.avg, 'W')}
                {renderStat('Avg HR', activity.stats?.hrm?.avg, 'bpm')}
                {renderStat('Avg Cadence', activity.stats?.cadence?.avg, 'rpm')}
            </View>

            <View style={styles.chipsRow}>
                <FileChip label="JSON" path={activity.fileName} />
                <FileChip label="TCX" path={activity.tcxFileName} />
                <FileChip label="FIT" path={activity.fitFileName} />
            </View>
        </View>
    );

    const GraphContent = (
        <View style={styles.graphWrapper}>
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
                    variant="details"
                    title="Delete Ride"
                    buttons={[
                        { label: 'Cancel', onPress: onDeleteCancel },
                        { label: 'Delete', onPress: onDeleteConfirm, attention: true },
                    ]}
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
    title: {
        fontSize: textSizes.dialogTitle,
        color: colors.text,
        fontWeight: 'bold',
    },
    startTime: {
        fontSize: textSizes.normalText,
        color: colors.disabled,
        marginBottom: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        marginBottom: 4,
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
        marginTop: 12,
        gap: 8,
    },
    chip: {
        backgroundColor: colors.tileActive,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    chipDisabled: {
        opacity: 0.5,
    },
    chipText: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: 'bold',
    },
    graphWrapper: {
        flex: 1,
        minHeight: 250,
        marginTop: 8,
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