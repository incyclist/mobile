import React from 'react';
import { useWindowDimensions, View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '../Icon';
import { colors } from '../../theme';
import { METRIC_ICON, RideDashboardViewProps, getValueColor, ActivityDashboardItem, WorkoutDashboardLine } from './types';

const SEPARATOR_WIDTH = 1; // styles.separator's own width, below
const CONTAINER_H_PADDING = 8; // styles.container's own paddingHorizontal, below — applies on both sides

export const RideDashboardView = ({ items, layout = 'icon-top', compact = false, workoutShoutout = null }: RideDashboardViewProps) => {
    const { width } = useWindowDimensions();
    const showWorkoutShoutout = !!workoutShoutout && !compact;

    const minColWidth = 70; // Minimum column width for calculation in compact mode
    const maxCols = Math.floor(width / minColWidth);
    const visibleItems = compact ? items.slice(0, maxCols) : items;

    // Base width for non-compact mode (icon-top layout)
    const colWidthBase = 90;

    // Sizing for icon-top (and compact mode)
    const iconSizeTop = colWidthBase * 0.28;
    const valueSize = colWidthBase * 0.32;
    const unitSize = colWidthBase * 0.16;
    const secValueSize = colWidthBase * 0.22;
    const secUnitSize = colWidthBase * 0.14;

    // Sizing for icon-left layout (non-compact only)
    const iconSizeLeft = valueSize; // Fix 1: Reduce icon size to match value font height
    const colWidthLeft = colWidthBase + iconSizeLeft + 6; // Fix 1: Adjust column width

    // The workout shoutout must share the metrics row's exact left/right edges. The row is
    // intrinsically sized (centered, not stretched) in normal/tablet layout, so its width is
    // computed analytically here from the same per-column width `renderMetric` uses below —
    // deliberately not measured via onLayout, which this codebase has already found unreliable
    // under both the Jest test renderer and the Storybook react-native-web renderer (see
    // WorkoutGraph's smart wrapper), and would otherwise leave the shoutout permanently hidden
    // in both tests and stories.
    const nonCompactColWidth = layout === 'icon-left' ? colWidthLeft : colWidthBase;
    const metricsRowWidth = visibleItems.length * nonCompactColWidth
        + Math.max(0, visibleItems.length - 1) * SEPARATOR_WIDTH
        + CONTAINER_H_PADDING * 2;

    // Data helpers
    const getPrimary = (item: ActivityDashboardItem) => item.data[0];
    const getSecondary = (item: ActivityDashboardItem) => (item.data.length > 1 ? item.data[1] : null);

    const renderMetric = (item: ActivityDashboardItem, index: number) => {
        const primary = getPrimary(item);
        const secondary = getSecondary(item);
        const iconName = (METRIC_ICON[item.title] ?? 'activity') as IconName;
        const primaryColor = getValueColor(item.dataState);

        const isLast = index === visibleItems.length - 1;

        // Determine effective layout
        const effectiveLayout = compact ? 'icon-left' : (layout ?? 'icon-top');
        
        const currentColWidth = 
            compact 
                ? width / visibleItems.length 
                : (effectiveLayout === 'icon-left' ? colWidthLeft : colWidthBase);
        const currentIconSize = (effectiveLayout === 'icon-left' && !compact) ? iconSizeLeft : iconSizeTop;
        
        // Fix 2: Smaller font for Time column only in compact or icon-left mode
        const isTimeColumn = item.title === 'Time';
        const effectiveValueSize =  isTimeColumn
            ? valueSize * 0.75
            : valueSize;

        // Secondary row is never shown in compact mode, and is replaced wholesale by the
        // workout shoutout line (below) when one is supplied — not shown alongside it.
        const showSecondaryRow = secondary && !compact && !showWorkoutShoutout;

        if (effectiveLayout === 'icon-top') {
            return (
                <React.Fragment key={`${item.title}-${index}`}>
                    <View style={[styles.metricCol, { width: currentColWidth }]}>
                        <Icon name={iconName} size={currentIconSize} color={primaryColor} />
                        <View style={styles.valueRow}>
                            <Text style={[styles.value, { fontSize: effectiveValueSize, color: primaryColor }]}>
                                {primary.value ?? '--'}
                            </Text>
                            {primary.unit && (
                                <Text style={[styles.unit, { fontSize: unitSize }]}>
                                    {primary.unit}
                                </Text>
                            )}
                        </View>
                        {showSecondaryRow && (
                            <View style={styles.valueRow}>
                                <Text style={[styles.secValue, { fontSize: secValueSize }]}>
                                    {secondary.value ?? '--'}
                                </Text>
                                {secondary.unit && (
                                    <Text style={[styles.secUnit, { fontSize: secUnitSize }]}>
                                        {secondary.unit}
                                    </Text>
                                )}
                                {secondary.label && (
                                    <Text style={[styles.secUnit, { fontSize: secUnitSize }]}>
                                        {secondary.label}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    {!isLast && <View style={styles.separator} />}
                </React.Fragment>
            );
        } else { // effectiveLayout === 'icon-left' (implies !compact or compact=true)
            return (
                <React.Fragment key={`${item.title}-${index}`}>
                    <View style={[styles.metricColLeft, { width: currentColWidth }]}>
                        <Icon name={iconName} size={currentIconSize} color={primaryColor} />
                        <View style={styles.valueStack}>
                            <View style={styles.valueRow}>
                                <Text style={[styles.value, { fontSize: effectiveValueSize, color: primaryColor }]}>
                                    {primary.value ?? '--'}
                                </Text>
                                {primary.unit && (
                                    <Text style={[styles.unit, { fontSize: unitSize }]}>
                                        {primary.unit}
                                    </Text>
                                )}
                            </View>
                            {showSecondaryRow && (
                                <View style={styles.valueRow}>
                                    <Text style={[styles.secValue, { fontSize: secValueSize }]}>
                                        {secondary.value ?? '--'}
                                    </Text>
                                    {secondary.unit && (
                                        <Text style={[styles.secUnit, { fontSize: secUnitSize }]}>
                                            {secondary.unit}
                                        </Text>
                                    )}
                                    {secondary.label && (
                                        <Text style={[styles.secUnit, { fontSize: secUnitSize }]}>
                                            {secondary.label}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                    {!isLast && <View style={styles.separator} />}
                </React.Fragment>
            );
        }
    };

    return (
        <View style={styles.wrapper}>
            <View style={[styles.container, { alignSelf: compact ? 'stretch' : 'center' }]}>
                {visibleItems.map((item, index) => renderMetric(item, index))}
            </View>
            {showWorkoutShoutout && (
                <WorkoutShoutoutLine
                    line={workoutShoutout as WorkoutDashboardLine}
                    width={metricsRowWidth}
                    fontSize={valueSize}
                />
            )}
        </View>
    );
};

// Tablet-only, workout-ride-screen-only shoutout that takes over the normal-layout second line
// (workout-ride-page-service-design.md §3.3): one fully-composed sentence, e.g. "260W at
// 100-120HR for 5min - VO2 max (3/5)" — no separate power/duration/remaining chips (those are
// already live on WorkoutStepsList's current-step row; repeating them here was the pre-1.0
// design and is now considered wrong, session 3.3 rework). `width` matches the metrics row above
// it exactly, so the two share left/right boundaries instead of one being centered narrower/wider
// than the other; `fontSize` matches the metrics row's own number size (`valueSize`).
const WorkoutShoutoutLine = ({ line, width, fontSize }: { line: WorkoutDashboardLine; width: number; fontSize: number }) => (
    <View style={[styles.shoutout, { width, alignSelf: 'center' }]}>
        <Text style={[styles.shoutoutText, { fontSize }]} numberOfLines={2}>
            {line.text}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'stretch',
    },
    container: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingHorizontal: CONTAINER_H_PADDING,
        paddingVertical: 4,
        alignItems: 'center',
    },
    shoutout: {
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    shoutoutText: {
        color: colors.text,
        fontWeight: '700',
        textAlign: 'center',
    },
    metricCol: {
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 2,
    },
    metricColLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 6,
    },
    valueStack: {
        flexDirection: 'column',
        gap: 2,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    value: {
        color: colors.text,
        fontWeight: '700',
    },
    unit: {
        color: colors.disabled,
        fontWeight: '400',
    },
    secValue: {
        color: colors.disabled,
        fontWeight: '600',
    },
    secUnit: {
        color: colors.disabled,
        fontWeight: '400',
    },
    separator: {
        width: SEPARATOR_WIDTH,
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginVertical: 4,
    },
});
