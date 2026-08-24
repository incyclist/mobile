import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrevRidesRow } from './PrevRidesRow';
import { PrevRidesRowProps, PrevRidesSlotRect } from './types';
import { colors, textSizes } from '../../theme';
import { SLOT_GAP, BOTTOM_BAR_RATIO } from '../../hooks/render/useRideOverlayLayout';

/**
 * Mirrors the reserved-slot prototype's ghost sizing (`RideOverlayPrototype.stories.tsx`) — the
 * same 24/22 dp budget the tablet ear already uses. Not currently exported from
 * `useRideOverlayLayout.ts`, so pinned here at the identical values rather than imported.
 */
const PHASE3_ROW_HEIGHT = 24;
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
}

/**
 * Phone-only expanded previous-rides panel: anchored to the corner slot's position, growing
 * downward into the freed band between the slot's bottom edge and the top of the bottom
 * elevation strip — the same `earFreeBand`/`visibleRows` computation the tablet ear already uses,
 * just anchored at the slot's own bottom edge instead of the elevation widget's.
 */
export const PrevRidesExpandedPanel = ({ rows, anchor, screenHeight, onVisibleRowsChange }: PrevRidesExpandedPanelProps) => {
    const anchorBottom = anchor.top + anchor.height;
    const earFreeBand = screenHeight - BOTTOM_BAR_RATIO * screenHeight - anchorBottom - 2 * SLOT_GAP;
    const visibleRows = clamp(
        Math.floor((earFreeBand - PHASE3_HEADER_HEIGHT) / PHASE3_ROW_HEIGHT),
        MIN_VISIBLE_ROWS,
        MAX_VISIBLE_ROWS
    );

    useEffect(() => {
        onVisibleRowsChange?.(visibleRows);
    }, [visibleRows, onVisibleRowsChange]);

    const visibleRowData = useMemo(() => rows.slice(0, visibleRows), [rows, visibleRows]);
    const panelHeight = PHASE3_HEADER_HEIGHT + visibleRowData.length * PHASE3_ROW_HEIGHT;

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
            <Text style={styles.header}>Previous Rides</Text>
            {visibleRowData.map((row, index) => (
                <PrevRidesRow key={`${row.position}-${index}`} {...row} layout="compact" />
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
    header: {
        height: PHASE3_HEADER_HEIGHT,
        lineHeight: PHASE3_HEADER_HEIGHT,
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.8,
    },
});
