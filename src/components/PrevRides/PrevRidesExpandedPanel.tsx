import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { PrevRidesRow, ROW_MARGIN_BOTTOM } from './PrevRidesRow';
import { PrevRidesExpandChevron } from './PrevRidesExpandChevron';
import { PrevRidesRowProps, PrevRidesSlotRect } from './types';
import { colors, textSizes } from '../../theme';
import { SLOT_GAP, BOTTOM_BAR_RATIO } from '../../hooks/render/useRideOverlayLayout';

/**
 * Fallback budget used only until the first row has actually rendered — mirrors the reserved-slot
 * prototype's ghost sizing (`RideOverlayPrototype.stories.tsx`). Real device font metrics render a
 * `rowCompact` taller than this guess (the same gap the tablet ear's fixed constant had), so once a
 * row has mounted its real measured height replaces it — see `onFirstRowLayout` below.
 */
const PHASE3_ROW_HEIGHT_FALLBACK = 24;
const PHASE3_HEADER_HEIGHT = 22;
const MIN_VISIBLE_ROWS = 1;
const MAX_VISIBLE_ROWS = 10;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export interface PrevRidesExpandedPanelProps {
    /** The full, already-sorted `select()` result — this component only trims it to what fits. */
    rows: PrevRidesRowProps[];
    /** The corner slot's own rect — the panel grows downward from its bottom edge. */
    anchor: PrevRidesSlotRect;
    screenHeight: number;
    /**
     * Reports how many rows the panel's own height budget can show. Stands in for
     * `RidePageService.setPrevRidesVisibleRows()`, which the currently pinned `incyclist-services`
     * version does not export yet — wiring this to the real service call is session 3.1's job.
     */
    onVisibleRowsChange?: (visibleRows: number) => void;
    /** When given, renders a chevron in the header that calls this on tap — the panel's own
     *  explicit, discoverable collapse control (repo-owner review 2026-08-25: a screen-wide
     *  tap-outside-to-dismiss backdrop was ambiguous with taps on the row content itself, and gave
     *  no visible affordance at all). Omitted where the caller has no collapse concept (none, so
     *  far — every current caller passes it). */
    onCollapse?: () => void;
}

/**
 * Phone-only expanded previous-rides panel: anchored to the corner slot's position, growing
 * downward into the freed band between the slot's bottom edge and the top of the bottom
 * elevation strip — the same `earFreeBand`/`visibleRows` computation the tablet ear already uses,
 * just anchored at the slot's own bottom edge instead of the elevation widget's.
 */
export const PrevRidesExpandedPanel = ({ rows, anchor, screenHeight, onVisibleRowsChange, onCollapse }: PrevRidesExpandedPanelProps) => {
    const anchorBottom = anchor.top + anchor.height;
    const earFreeBand = screenHeight - BOTTOM_BAR_RATIO * screenHeight - anchorBottom - 2 * SLOT_GAP;

    const [measuredRowHeight, setMeasuredRowHeight] = useState<number | undefined>(undefined);
    const onFirstRowLayout = useCallback((e: LayoutChangeEvent) => {
        const height = e.nativeEvent.layout.height;
        setMeasuredRowHeight((prev) => (prev === height ? prev : height));
    }, []);

    const rowSpacing = (measuredRowHeight ?? PHASE3_ROW_HEIGHT_FALLBACK) + ROW_MARGIN_BOTTOM;
    const visibleRows = clamp(
        Math.floor((earFreeBand - PHASE3_HEADER_HEIGHT) / rowSpacing),
        MIN_VISIBLE_ROWS,
        MAX_VISIBLE_ROWS
    );

    useEffect(() => {
        onVisibleRowsChange?.(visibleRows);
    }, [visibleRows, onVisibleRowsChange]);

    const visibleRowData = useMemo(() => rows.slice(0, visibleRows), [rows, visibleRows]);
    const panelHeight = PHASE3_HEADER_HEIGHT + visibleRowData.length * rowSpacing;

    return (
        <View
            testID="prev-rides-expanded-panel"
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
                <Text style={styles.header}>Previous Rides</Text>
                {onCollapse && <PrevRidesExpandChevron expanded onPress={onCollapse} />}
            </View>
            {visibleRowData.map((row, index) => (
                <View
                    key={`${row.position}-${index}`}
                    testID={index === 0 ? 'prev-rides-panel-first-row-measure' : undefined}
                    onLayout={index === 0 ? onFirstRowLayout : undefined}
                >
                    <PrevRidesRow {...row} layout="compact" />
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
        height: PHASE3_HEADER_HEIGHT,
    },
    header: {
        lineHeight: PHASE3_HEADER_HEIGHT,
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.8,
    },
});
