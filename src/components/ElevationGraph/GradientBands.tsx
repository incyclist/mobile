import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import type { RouteApiDetail } from 'incyclist-services';
import { colors } from '../../theme';
import { computeGraphPoints } from './utils';

/**
 * Two stacked colour-coded gradient bands, `Original` above `Smoothed`, sharing one x-axis with
 * the elevation profile above them. Invisible (but still occupying its layout height) unless a
 * smoothing level is active - see `active` below.
 *
 * Why a second, separate visual rather than a redrawn/second line on the elevation chart: the
 * elevation curve itself barely moves under smoothing (a fraction of a pixel on a real track) - no
 * colour, weight or draw order recovers a difference that small. The same transform moves the
 * gradient by a factor, so the comparison belongs on that axis instead. Both bands stay on screen
 * together so the before/after reads at a glance without holding the previous state in memory.
 *
 * Reuses the exact column-per-pixel decimation and slope colouring (`computeGraphPoints` /
 * `getSlopeColor`) the elevation chart itself uses, so this introduces no new visual vocabulary.
 */

export interface GradientBandsProps {
    routeData?: RouteApiDetail;
    smoothedRouteData?: RouteApiDetail;
    pctReality?: number;
    bandHeight?: number;
    dimmed?: boolean;
    /** false when no smoothing level is active - there is nothing to compare against, so this
     * component stays invisible (opacity:0) but keeps its layout height, so switching a level in
     * or out never reflows the panel around it. */
    active?: boolean;
}

const BAND_HEIGHT_DEFAULT = 8;

export const GradientBands = (props: GradientBandsProps) => {
    const { routeData, smoothedRouteData, pctReality, bandHeight = BAND_HEIGHT_DEFAULT, dimmed, active } = props;
    const [width, setWidth] = useState(0);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
    }, []);

    const routeColumns = useMemo(() => {
        if (!routeData || width === 0) return [];
        return computeGraphPoints(routeData, width, 1, { pctReality }).graphPoints;
    }, [routeData, width, pctReality]);

    // the Smoothed band's slot is always reserved (see below) and only filled once a level is
    // active, so turning smoothing on/off never changes this container's height or position
    const smoothedColumns = useMemo(() => {
        if (!smoothedRouteData || width === 0) return [];
        return computeGraphPoints(smoothedRouteData, width, 1, { pctReality }).graphPoints;
    }, [smoothedRouteData, width, pctReality]);

    return (
        <View style={[styles.wrapper, !active ? styles.inactive : undefined, dimmed ? styles.dimmed : undefined]}>
            <View style={styles.row}>
                <Text style={styles.label}>Original</Text>
                <View style={[styles.track, { height: bandHeight }]} onLayout={onLayout}>
                    {routeColumns.map((c, i) => (
                        <View key={i} style={[styles.column, { backgroundColor: c.color }]} />
                    ))}
                </View>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Smoothed</Text>
                <View style={[styles.track, { height: bandHeight }]}>
                    {smoothedColumns.map((c, i) => (
                        <View key={i} style={[styles.column, { backgroundColor: c.color }]} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { width: '100%' },
    // reserves this component's layout height (unlike a conditional unmount would) while painting
    // nothing - at Off there is no second series to compare against, so no label or band should
    // be visible, only its reserved space so toggling a level never reflows the panel
    inactive: { opacity: 0 },
    dimmed: { opacity: 0.6 },
    row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
    label: { width: 56, color: colors.disabled, fontSize: 9 },
    track: { flex: 1, flexDirection: 'row', overflow: 'hidden' },
    column: { flex: 1, height: '100%' },
});
