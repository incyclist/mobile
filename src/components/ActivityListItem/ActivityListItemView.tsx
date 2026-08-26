import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ActivityListItemViewProps, ACTIVITY_LIST_ITEM_HEIGHT } from './types';
import { ActivityGraphPreview } from '../ActivityGraphPreview';
import { colors, textSizes } from '../../theme';
import { Icon } from '../Icon';

// Conditional import to prevent Storybook Vite from crashing — same pattern as RouteItemView.
// The fallback renders renderRightActions inline (rather than discarding it) so the delete
// action is still reachable in Storybook/web and in this file's own unit tests, where
// react-native-gesture-handler's native Swipeable is unavailable.
let Swipeable: any = View;
try {
    if (Platform.OS !== 'web') {
        Swipeable = require('react-native-gesture-handler').Swipeable;
    }
} catch {
    Swipeable = ({ children, renderRightActions }: any) => (
        <View>
            {children}
            {renderRightActions?.()}
        </View>
    );
}

export const ActivityListItemView = memo((props: ActivityListItemViewProps) => {
    const {
        title,
        dateStr,
        timeStr,
        durationStr,
        distanceValue,
        distanceUnit,
        elevationValue,
        elevationUnit,
        details,
        compact,
        outsideFold,
        ftp,
        onPress,
        onDelete,
    } = props;

    if (outsideFold) {
        return <View style={styles.outsideFold} />;
    }

    const hasLogs = details?.logs && details.logs.length > 0;
    const containerStyle = [
        styles.container,
        compact && styles.compactContainer
    ];

    const renderRightActions = () => (
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
    );

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
                <View style={styles.leftSection}>
                    {hasLogs ? (
                        <ActivityGraphPreview width={80} height={64} activity={details} ftp={ftp??200} />
                    ) : (
                        <View style={styles.placeholder} />
                    )}
                </View>

                <View style={styles.centerSection}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.dateTime}>
                        {dateStr}{'  '}{timeStr}{'  '}{durationStr}
                    </Text>
                </View>

                <View style={styles.metricsSection}>
                    <View style={styles.metricColumn}>
                        <Icon name="distance" size={16} color={colors.text} />
                        <Text style={styles.metricValue}>{distanceValue}</Text>
                        <Text style={styles.metricUnit}>{distanceUnit}</Text>
                    </View>
                    {elevationValue !== '' && (
                        <View style={styles.metricColumn}>
                            <Icon name="elevation" size={16} color={colors.text} />
                            <Text style={styles.metricValue}>{elevationValue}</Text>
                            <Text style={styles.metricUnit}>{elevationUnit}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
});

ActivityListItemView.displayName = 'ActivityListItemView';

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
    compactContainer: {
        height: 64,
        marginVertical: 2,
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
        color: colors.text,
        fontSize: textSizes.smallText,
        textAlign: 'center',
    },
    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: ACTIVITY_LIST_ITEM_HEIGHT,
        marginVertical: 4,
        borderRadius: 8,
    },
    deleteText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});