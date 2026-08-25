import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PrevRidesCornerPanel } from './PrevRidesCornerPanel';
import { MOCK_ROWS, MOCK_ROW_CHASER, MOCK_ROW_CURRENT } from './PrevRidesRow.mock';
import { PrevRidesSlotRect } from './types';
import { computeRideOverlayLayout } from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';

/**
 * The phone-only previous-rides panel: anchored below the elevation/workout corner slot, never
 * overlapping it (repo-owner review 2026-08-25 — elevation/workout no longer gets swapped out for
 * previous-rides, both stay visible independently). Pure view, no `incyclist-services` dependency:
 * `rows`/`slotRect` are plain props, and `onExpandPrevRides`/`onCollapsePrevRides`/
 * `onVisibleRowsChange` are component-level callbacks wired up to the real page service
 * (`RideOverlay.tsx`).
 *
 * The corner slot itself (elevation preview here) is not owned by this component — these stories
 * render a stand-in `ElevationSlot` purely so the panel has a realistic backdrop to anchor below,
 * matching how `RideOverlay.tsx` mounts the two independently.
 *
 * `slotRect` is taken directly from `computeRideOverlayLayout()`'s own compact-fallback
 * `.elevation` rect at each frame's size — the same geometry the existing elevation/workout
 * corner slot already renders at — rather than reproducing those constants here.
 */
const meta: Meta<typeof PrevRidesCornerPanel> = {
    title: 'Components/PrevRides/PrevRidesCornerPanel',
    component: PrevRidesCornerPanel,
};

export default meta;

type Story = StoryObj<typeof PrevRidesCornerPanel>;

const FALLBACK_SLOT_DEFAULT = (screenWidth: number, screenHeight: number): PrevRidesSlotRect => ({
    top: 0,
    right: 0,
    width: screenWidth * 0.2,
    height: screenHeight * 0.12,
});

const fallbackSlot = (screenWidth: number, screenHeight: number): PrevRidesSlotRect => {
    const layout = computeRideOverlayLayout({ screenWidth, screenHeight, screenLayout: 'compact', mapVisible: false });
    return layout.elevation ?? FALLBACK_SLOT_DEFAULT(screenWidth, screenHeight);
};

const ElevationSlot = ({ slotRect }: { slotRect: PrevRidesSlotRect }) => (
    <View
        style={[
            styles.elevationSlot,
            { top: slotRect.top, right: slotRect.right, width: slotRect.width, height: slotRect.height },
        ]}
    >
        <Text style={styles.elevationLabel}>elevation</Text>
    </View>
);

const PhoneFrame = ({ width, height, children }: { width: number; height: number; children: React.ReactNode }) => (
    <View style={[styles.frame, { width, height }]}>
        <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {children}
    </View>
);

// --- Reference frame: 844×390 ---

/** Default state on mount — full list expanded, elevation preview stays visible above it. */
export const Expanded: Story = {
    render: () => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <ElevationSlot slotRect={slotRect} />
                <PrevRidesCornerPanel slotRect={slotRect} screenHeight={390} rows={MOCK_ROWS} />
            </PhoneFrame>
        );
    },
};

/** Collapsed — just the elevation preview and a small chevron button below it, no row data. */
export const Collapsed: Story = {
    render: () => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <ElevationSlot slotRect={slotRect} />
                <PrevRidesCornerPanel slotRect={slotRect} screenHeight={390} rows={MOCK_ROWS} defaultExpanded={false} />
            </PhoneFrame>
        );
    },
};

/** A short field (current + one other rider) — the panel sizes to the data it has, it doesn't pad
 *  out empty rows to fill the budget. */
export const ExpandedShortField: Story = {
    render: () => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <ElevationSlot slotRect={slotRect} />
                <PrevRidesCornerPanel
                    slotRect={slotRect}
                    screenHeight={390}
                    rows={[MOCK_ROW_CHASER, MOCK_ROW_CURRENT]}
                />
            </PhoneFrame>
        );
    },
};

// --- Tighter frame: confirms the panel clamps rather than overflowing into the bottom bar ---

const TIGHT_WIDTH = 700;
const TIGHT_HEIGHT = 300;

export const ExpandedTightFrameClamps: Story = {
    render: () => {
        const slotRect = fallbackSlot(TIGHT_WIDTH, TIGHT_HEIGHT);
        return (
            <PhoneFrame width={TIGHT_WIDTH} height={TIGHT_HEIGHT}>
                <ElevationSlot slotRect={slotRect} />
                <PrevRidesCornerPanel slotRect={slotRect} screenHeight={TIGHT_HEIGHT} rows={MOCK_ROWS} />
            </PhoneFrame>
        );
    },
};

const styles = StyleSheet.create({
    frame: {
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: colors.background,
    },
    elevationSlot: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    elevationLabel: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.6,
    },
});
