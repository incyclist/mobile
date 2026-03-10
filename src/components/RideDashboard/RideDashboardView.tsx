import React from 'react';
import { useWindowDimensions, View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '../Icon';
import { colors } from '../../theme';
import { METRIC_ICON, RideDashboardViewProps, getValueColor, ActivityDashboardItem } from './types';

export const RideDashboardView = ({ items, layout = 'icon-top', compact = false }: RideDashboardViewProps) => {
    const { width } = useWindowDimensions();

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

        // Secondary row is never shown in compact mode
        const showSecondaryRow = secondary && !compact;

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
        <View style={[styles.container, { alignSelf: compact ? 'stretch' : 'center' }]}>
            {visibleItems.map((item, index) => renderMetric(item, index))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
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
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginVertical: 4,
    },
});
