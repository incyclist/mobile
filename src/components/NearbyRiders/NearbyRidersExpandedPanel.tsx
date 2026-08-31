import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { NearbyRiderRow } from './NearbyRiderRow';
import { NearbyRiderRowProps, NearbyRidersSlotRect } from './types';
import { PrevRidesExpandChevron } from '../PrevRides';
import { colors, textSizes } from '../../theme';
import { SLOT_GAP, BOTTOM_BAR_RATIO } from '../../hooks/render/useRideOverlayLayout';

/**
 * Fallback budget used only until the first row has actually rendered (same fallback-then-measure
 * pattern as `PrevRidesExpandedPanel`'s `PHASE3_ROW_HEIGHT_FALLBACK`). Deliberately **not** copied
 * from that constant (24, tuned for `PrevRidesRow`'s flat one-line compact row): `NearbyRiderRow`
 * has no compact/trimmed variant (design doc §5.2/session plan 2.1 — every field renders on every
 * tier) and renders as a two-line, padded card instead, much closer in shape to `PrevRidesRow`'s
 * `'normal'` tablet tier (~90dp) than its phone tier. This is a same-order-of-magnitude estimate
 * for the very first frame only — the real value always comes from `onFirstRowLayout` below.
 */
const NEARBY_ROW_HEIGHT_FALLBACK = 64;
/** Matches `NearbyRiderRow`'s own `styles.row.marginBottom` (`NearbyRiderRow.tsx`) — kept as a
 *  local constant rather than an import so this session doesn't need to modify session 2.1's
 *  already-built row component just to export it (mirrors why `PrevRidesRow` exports its own
 *  `ROW_MARGIN_BOTTOM`: external row-spacing math needs the margin, since `onLayout` reports a
 *  view's own box, not the margin around it). Flagged here so the two values don't silently drift
 *  apart unnoticed. */
const NEARBY_ROW_MARGIN_BOTTOM = 3;
const HEADER_HEIGHT = 22;
const MIN_VISIBLE_ROWS = 1;
const MAX_VISIBLE_ROWS = 10;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export interface NearbyRidersExpandedPanelProps {
    /** The full `nearbyRiders.rows` list — already sorted/capped server-side (design doc §5.1),
     *  this component only trims it to what fits. */
    rows: NearbyRiderRowProps[];
    /** The corner slot's own rect (elevation/workout) — the panel grows downward from its bottom
     *  edge, mirroring `PrevRidesExpandedPanel`'s `anchor`. */
    anchor: NearbyRidersSlotRect;
    screenHeight: number;
    /** Reports how many rows the panel's own height budget can show — stands in for a future
     *  `RidePageService` "visible rows" report the same way `PrevRidesExpandedPanel`'s
     *  `onVisibleRowsChange` does (design doc §5.1 notes Nearby Riders doesn't actually need this
     *  fed back into a selection algorithm, unlike PrevRides — `ActiveRidesService` already caps
     *  server-side — but the panel still needs to know its own budget to slice `rows` correctly). */
    onVisibleRowsChange?: (visibleRows: number) => void;
    /** Renders a header chevron that calls this on tap when given — mirrors
     *  `PrevRidesExpandedPanel`'s `onCollapse`. */
    onCollapse?: () => void;
}

/**
 * Phone-only expanded nearby-riders panel: anchored to the corner slot's position, growing
 * downward into the freed band below it — the same `earFreeBand`/`visibleRows` computation
 * `PrevRidesExpandedPanel` already uses, just against `NearbyRiderRow`'s taller, untrimmed row.
 */
export const NearbyRidersExpandedPanel = ({ rows, anchor, screenHeight, onVisibleRowsChange, onCollapse }: NearbyRidersExpandedPanelProps) => {
    const anchorBottom = anchor.top + anchor.height;
    const earFreeBand = screenHeight - BOTTOM_BAR_RATIO * screenHeight - anchorBottom - 2 * SLOT_GAP;

    const [measuredRowHeight, setMeasuredRowHeight] = useState<number | undefined>(undefined);
    const onFirstRowLayout = useCallback((e: LayoutChangeEvent) => {
        const height = e.nativeEvent.layout.height;
        setMeasuredRowHeight((prev) => (prev === height ? prev : height));
    }, []);

    const rowSpacing = (measuredRowHeight ?? NEARBY_ROW_HEIGHT_FALLBACK) + NEARBY_ROW_MARGIN_BOTTOM;
    const visibleRows = clamp(Math.floor((earFreeBand - HEADER_HEIGHT) / rowSpacing), MIN_VISIBLE_ROWS, MAX_VISIBLE_ROWS);

    useEffect(() => {
        onVisibleRowsChange?.(visibleRows);
    }, [visibleRows, onVisibleRowsChange]);

    const visibleRowData = useMemo(() => rows.slice(0, visibleRows), [rows, visibleRows]);
    const panelHeight = HEADER_HEIGHT + visibleRowData.length * rowSpacing;

    return (
        <View
            testID="nearby-riders-expanded-panel"
            style={[
                styles.panel,
                {
                    top: anchorBottom + SLOT_GAP,
                    left: anchor.left,
                    right: anchor.right,
                    width: anchor.width,
                    height: panelHeight,
                },
            ]}
        >
            <View style={styles.headerRow}>
                <Text style={styles.header}>Nearby Riders</Text>
                {onCollapse && <PrevRidesExpandChevron expanded onPress={onCollapse} label="nearby riders" testID="nearby-riders-expand-chevron" />}
            </View>
            {visibleRowData.map((row, index) => (
                <View
                    key={`${row.name}-${index}`}
                    testID={index === 0 ? 'nearby-riders-panel-first-row-measure' : undefined}
                    onLayout={index === 0 ? onFirstRowLayout : undefined}
                >
                    <NearbyRiderRow {...row} />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    panel: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 4,
        paddingHorizontal: 4,
        overflow: 'hidden',
        zIndex: 11,
        elevation: 11,
    },
    headerRow: {
        height: HEADER_HEIGHT,
    },
    header: {
        lineHeight: HEADER_HEIGHT,
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.8,
    },
});
