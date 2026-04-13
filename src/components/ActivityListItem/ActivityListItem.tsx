import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatDateTime } from 'incyclist-services';
import { ActivityListItemProps, ACTIVITY_LIST_ITEM_HEIGHT } from './types';
import { ActivityGraphPreview } from '../ActivityGraphPreview';
import { colors, textSizes } from '../../theme';

export const ActivityListItem = memo((props: ActivityListItemProps) => {
    const { activityInfo, onPress, compact } = props;
    const { summary, details } = activityInfo;
    const { id, title, startTime, rideTime, distance } = summary;

    const handlePress = useCallback(() => {
        onPress(id);
    }, [id, onPress]);

    const displayTitle =
        title === 'Incyclist Ride'
            ? details?.route?.title ?? details?.route?.name ?? 'Incyclist Ride'
            : title;

    const dateStr = formatDateTime(new Date(startTime), '%d.%m.%Y');
    const timeStr = formatDateTime(new Date(startTime), '%H:%M');

    const hours = Math.floor(rideTime / 3600);
    const minutes = Math.floor((rideTime % 3600) / 60);
    const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    let distanceStr = '';
    if (typeof distance === 'object' && distance !== null && 'value' in distance && 'unit' in distance) {
        distanceStr = `${distance.value.toFixed(1)} ${distance.unit}`;
    } else if (typeof distance === 'number') {
        distanceStr = `${(distance / 1000).toFixed(1)} km`;
    }

    const elevation = (summary as any).totalElevation;
    let elevationStr = '';
    if (typeof elevation === 'object' && elevation !== null && 'value' in elevation && 'unit' in elevation) {
        elevationStr = `${Math.round(elevation.value)} ${elevation.unit}`;
    } else if (typeof elevation === 'number' && !isNaN(elevation)) {
        elevationStr = `${Math.round(elevation)}m`;
    }

    const hasLogs = details?.logs && details.logs.length > 0;

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.leftSection}>
                {hasLogs ? (
                    <ActivityGraphPreview width={80} height={64} activity={details} ftp={200} />
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>

            <View style={styles.centerSection}>
                <Text style={styles.title} numberOfLines={1}>
                    {displayTitle}
                    {compact && <Text style={styles.dateCompact}> - {dateStr}</Text>}
                </Text>
                {!compact && (
                    <Text style={styles.dateTime}>
                        {dateStr}{'  '}{timeStr}{'  '}{durationStr}
                    </Text>
                )}
            </View>

            <View style={styles.metricsSection}>
                <View style={styles.metricColumn}>
                    <Image source={require('../../assets/icons/length.gif')} style={styles.metricIcon} />
                    <Text style={styles.metricLabel}>Distance</Text>
                    <Text style={styles.metricValue}>{distanceStr}</Text>
                </View>
                {elevationStr !== '' && (
                    <View style={styles.metricColumn}>
                        <Image source={require('../../assets/icons/up.gif')} style={styles.metricIcon} />
                        <Text style={styles.metricLabel}>Elevation</Text>
                        <Text style={styles.metricValue}>{elevationStr}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
});

ActivityListItem.displayName = 'ActivityListItem';

const styles = StyleSheet.create({
    container: {
        height: ACTIVITY_LIST_ITEM_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.listItemBackground,
        paddingHorizontal: 12,
        marginVertical: 4,
        marginHorizontal: 12,
        borderRadius: 8,
    },
    leftSection: {
        width: 80,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        overflow: 'hidden',
    },
    placeholder: {
        width: 80,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
    },
    centerSection: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
    dateCompact: {
        fontSize: textSizes.smallText,
        fontWeight: 'normal',
        color: colors.text,
    },
    dateTime: {
        color: colors.text,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
    metricsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
        paddingRight: 8,
    },
    metricColumn: {
        alignItems: 'center',
        minWidth: 56,
    },
    metricIcon: {
        width: 16,
        height: 16,
        tintColor: colors.text,
    },
    metricLabel: {
        color: colors.text,
        fontSize: textSizes.smallText,
    },
    metricValue: {
        color: colors.text,
        fontSize: textSizes.smallText,
        fontWeight: '500',
    },
});