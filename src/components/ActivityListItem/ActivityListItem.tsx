import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ActivityListItemProps } from './types';
import { colors, textSizes } from '../../theme';

export const ActivityListItem = ({ activityInfo, onPress }: ActivityListItemProps) => {
    const handlePress = useCallback(() => {
        onPress(activityInfo.id);
    }, [activityInfo.id, onPress]);

    const dateStr = useMemo(() => {
        if (!activityInfo.startTime) return '';
        return new Date(activityInfo.startTime).toLocaleDateString();
    }, [activityInfo.startTime]);

    const timeStr = useMemo(() => {
        if (!activityInfo.startTime) return '';
        return new Date(activityInfo.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }, [activityInfo.startTime]);

    const durationStr = useMemo(() => {
        const seconds = activityInfo.summary?.duration ?? 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }, [activityInfo.summary?.duration]);

    const getMetricParts = (val: any, type: 'distance' | 'elevation') => {
        if (val === undefined || val === null) return null;
        
        if (typeof val === 'object' && val.value !== undefined) {
            return { value: val.value.toString(), unit: val.unit };
        }
        
        if (type === 'distance') {
            return { value: (val / 1000).toFixed(1), unit: 'km' };
        }
        
        return { value: Math.round(val).toString(), unit: 'm' };
    };

    const distance = useMemo(() => 
        getMetricParts(activityInfo.summary?.totalDistance, 'distance'), 
        [activityInfo.summary?.totalDistance]
    );
    
    const elevation = useMemo(() => 
        getMetricParts(activityInfo.summary?.totalElevation, 'elevation'), 
        [activityInfo.summary?.totalElevation]
    );

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={handlePress} 
            activeOpacity={0.7}
        >
            <View style={styles.centerSection}>
                <Text style={styles.title} numberOfLines={1}>
                    {activityInfo.name || 'Activity'}
                </Text>
                <Text style={styles.subText}>
                    {`${dateStr}  ${timeStr}  ${durationStr}`}
                </Text>
            </View>

            <View style={styles.metricsContainer}>
                {distance && (
                    <View style={styles.metricColumn}>
                        <Image 
                            source={require('../../assets/icons/length.gif')} 
                            style={styles.metricIcon} 
                        />
                        <Text style={styles.metricValue}>{distance.value}</Text>
                        <Text style={styles.metricUnit}>{distance.unit}</Text>
                    </View>
                )}
                {elevation && (
                    <View style={styles.metricColumn}>
                        <Image 
                            source={require('../../assets/icons/elevation.gif')} 
                            style={styles.metricIcon} 
                        />
                        <Text style={styles.metricValue}>{elevation.value}</Text>
                        <Text style={styles.metricUnit}>{elevation.unit}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: colors.listItemBackground,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    subText: {
        color: colors.disabled,
        fontSize: textSizes.smallText,
        marginTop: 2,
    },
    metricsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricColumn: {
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricIcon: {
        width: 20,
        height: 20,
        marginBottom: 2,
        resizeMode: 'contain',
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