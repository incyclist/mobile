import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { formatDateTime, useActivityList } from 'incyclist-services';
import { ActivityListItemProps, ACTIVITY_LIST_ITEM_HEIGHT } from './types';
import { ActivityGraphPreview } from '../ActivityGraphPreview';
import { colors, textSizes } from '../../theme';

export const ActivityListItem = memo((props: ActivityListItemProps) => {
    const { activityInfo, onPress, outsideFold } = props;
    const { summary, details: initialDetails } = activityInfo;
    const { id, title, startTime, rideTime, distance } = summary;

    const service = useActivityList();
    const refInitialized = useRef(false);
    const [details, setDetails] = useState(initialDetails);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
        if (details?.logs?.length || !id) return;
        const observer = service.getActivityDetails(id);
        observer.on('loaded', (d: any) => setDetails(d));
    }, []);

    const handlePress = useCallback(() => {
        onPress(id);
    }, [id, onPress]);

    if (outsideFold) {
        return <View style={styles.outsideFold} />;
    }

    const displayTitle =
        title === 'Incyclist Ride'
            ? details?.route?.title ?? details?.route?.name ?? 'Incyclist Ride'
            : title;

    const dateStr = formatDateTime(new Date(startTime), '%d.%m.%Y');
    const timeStr = formatDateTime(new Date(startTime), '%H:%M');

    const hours = Math.floor(rideTime / 3600);
    const minutes = Math.floor((rideTime % 3600) / 60);
    const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    let distanceValue = '';
    let distanceUnit = '';
    if (typeof distance === 'object' && distance !== null && 'value' in distance && 'unit' in distance) {
        distanceValue = distance.value.toFixed(1);
        distanceUnit = distance.unit;
    } else if (typeof distance === 'number') {
        distanceValue = (distance / 1000).toFixed(1);
        distanceUnit = 'km';
    }

    const elevation = (summary as any).totalElevation;
    let elevationValue = '';
    let elevationUnit = '';
    if (typeof elevation === 'object' && elevation !== null && 'value' in elevation && 'unit' in elevation) {
        elevationValue = Math.round(elevation.value).toString();
        elevationUnit = elevation.unit;
    } else if (typeof elevation === 'number' && !isNaN(elevation)) {
        elevationValue = Math.round(elevation).toString();
        elevationUnit = 'm';
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
                </Text>
                <Text style={styles.dateTime}>
                    {dateStr}{'  '}{timeStr}{'  '}{durationStr}
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
    outsideFold: {
        height: ACTIVITY_LIST_ITEM_HEIGHT,
        marginVertical: 4,
        marginHorizontal: 12,
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
        marginTop: 6,
        marginBottom: 3,
    },
    metricUnit: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        textAlign: 'center',
    },
});