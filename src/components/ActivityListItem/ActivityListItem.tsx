import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatDateTime } from 'incyclist-services';
import { ActivityGraphPreview } from '../ActivityGraphPreview';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { ActivityListItemProps, ACTIVITY_LIST_ITEM_HEIGHT } from './types';

const ActivityListItemView = ({ activityInfo, onPress }: ActivityListItemProps) => {
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

    const durationStr = getDurationText(rideTime);

    let distanceValue = '';
    let distanceUnit = '';
    if (distance && typeof distance === 'object' && 'value' in distance && 'unit' in distance) {
        distanceValue = (distance as any).value.toFixed(1);
        distanceUnit = (distance as any).unit;
    } else if (typeof distance === 'number') {
        distanceValue = (distance / 1000).toFixed(1);
        distanceUnit = 'km';
    }

    const elevation = (summary as any).totalElevation;
    let elevationValue = '';
    let elevationUnit = '';
    if (elevation && typeof elevation === 'object' && 'value' in elevation && 'unit' in elevation) {
        elevationValue = Math.round(elevation.value).toString();
        elevationUnit = elevation.unit;
    } else if (typeof elevation === 'number' && !isNaN(elevation)) {
        elevationValue = Math.round(elevation).toString();
        elevationUnit = 'm';
    }

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
                </Text>
                <Text style={styles.dateTime} numberOfLines={1}>
                    {`${dateStr}  ${timeStr}  ${durationStr}`}
                </Text>
            </View>

            <View style={styles.metricsSection}>
                <View style={styles.metricColumn}>
                    <Image source={require('../../assets/icons/length.gif')} style={styles.metricIcon} />
                    <Text style={styles.metricValue}>{distanceValue}</Text>
                    <Text style={styles.metricUnit}>{distanceUnit}</Text>
                </View>
                {elevationValue !== '' && (
                    <View style={styles.metricColumn}>
                        <Image source={require('../../assets/icons/up.gif')} style={styles.metricIcon} />
                        <Text style={styles.metricValue}>{elevationValue}</Text>
                        <Text style={styles.metricUnit}>{elevationUnit}</Text>
                    </View>
                )}
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
    metricValue: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
        textAlign: 'center',
    },
    metricUnit: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        textAlign: 'center',
    },
});

export const ActivityListItem = memo(ActivityListItemView);