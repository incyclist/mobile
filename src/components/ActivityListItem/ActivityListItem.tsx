import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityInfoUI, formatDateTime } from 'incyclist-services';
import { ActivityGraphPreview } from '../ActivityGraphPreview';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { ActivityListItemProps, ACTIVITY_LIST_ITEM_HEIGHT } from './types';

const ActivityListItemView = ({ activityInfo, onPress, compact }: ActivityListItemProps) => {
    const { summary, details } = activityInfo;
    const { id, title: summaryTitle, startTime, rideTime, distance } = summary;

    const handlePress = useCallback(() => {
        onPress(id);
    }, [id, onPress]);

    const title = summaryTitle === 'Incyclist Ride'
        ? (details?.route?.title ?? details?.route?.name ?? 'Incyclist Ride')
        : summaryTitle;

    const dateStr = formatDateTime(new Date(startTime), '%d.%m.%Y');
    const timeStr = formatDateTime(new Date(startTime), '%H:%M');

    const getDurationText = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) {
            return `${h}h ${m}min`;
        }
        return `${m}min`;
    };

    const getDistanceText = (dist: any) => {
        if (dist && typeof dist === 'object' && 'value' in dist && 'unit' in dist) {
            return `${dist.value.toFixed(1)} ${dist.unit}`;
        }
        if (typeof dist === 'number') {
            return `${(dist / 1000).toFixed(1)} km`;
        }
        return '';
    };

    const hasLogs = !!details?.logs && details.logs.length > 0;
    const showPreview = !!details && hasLogs;

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.leftSection}>
                {showPreview ? (
                    <ActivityGraphPreview
                        width={80}
                        height={64}
                        activity={details}
                        ftp={200}
                    />
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>

            <View style={styles.centerSection}>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                    {compact && <Text style={styles.dateCompact}>{` - ${dateStr}`}</Text>}
                </Text>
                {!compact && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {`${dateStr} ${timeStr}`}
                    </Text>
                )}
            </View>

            <View style={styles.rightSection}>
                <Text style={styles.metricText} numberOfLines={1}>
                    {getDurationText(rideTime)}
                </Text>
                <Text style={styles.metricText} numberOfLines={1}>
                    {getDistanceText(distance)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: ACTIVITY_LIST_ITEM_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: colors.listItemBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    leftSection: {
        width: 80,
        height: 64,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: 80,
        height: 64,
        backgroundColor: colors.tileEmpty,
        borderRadius: 4,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '600',
    },
    dateCompact: {
        fontSize: textSizes.normalText,
        fontWeight: 'normal',
        color: colors.disabled,
    },
    subtitle: {
        color: colors.disabled,
        fontSize: textSizes.normalText,
        marginTop: 2,
    },
    rightSection: {
        width: 100,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    metricText: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
});

export const ActivityListItem = memo(ActivityListItemView);