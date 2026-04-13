import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {displayTitle}
                        {compact && <Text style={styles.dateCompact}> - {dateStr}</Text>}
                    </Text>
                </View>
                {!compact && (
                    <Text style={styles.dateTime}>
                        {dateStr} {timeStr}
                    </Text>
                )}
            </View>

            <View style={styles.rightSection}>
                <Text style={styles.duration}>{durationStr}</Text>
                <Text style={styles.distance}>{distanceStr}</Text>
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
    dateCompact: {
        fontSize: textSizes.smallText,
        fontWeight: 'normal',
        color: colors.disabled,
    },
    dateTime: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
    rightSection: {
        width: 100,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    duration: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '500',
    },
    distance: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 4,
    },
});