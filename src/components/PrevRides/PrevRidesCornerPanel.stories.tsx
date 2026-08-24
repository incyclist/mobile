import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PrevRidesCornerPanel } from './PrevRidesCornerPanel';
import { MOCK_ROWS, MOCK_ROW_CHASER, MOCK_ROW_CURRENT } from './PrevRidesRow.mock';
import { PrevRidesSlotRect } from './types';
import { computeRideOverlayLayout } from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';

/**
 * The phone-only chevron affordance + expand/collapse panel for the previous-rides corner slot.
 * Pure view, no `incyclist-services` dependency: `active`/`rows`/`slotRect` are plain props, and
 * `onExpandPrevRides`/`onCollapsePrevRides`/`onVisibleRowsChange` are component-level callbacks a
 * later session wires up to the real page service (`RidePageService.setPrevRidesVisibleRows()` is
 * not yet published from `incyclist-services`, so that reporting stops at this callback here).
 *
 * The condensed slot's own single-line content ("3rd · +0:08 to 2nd") is not owned by this
 * component — these stories render it as `children` purely so the chevron/panel have a realistic
 * backdrop to sit against, mirroring the "own condensed content vs. interaction layer" split the
 * component itself makes.
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

const CondensedLine = () => (
    <View style={styles.condensedLine}>
        <Text style={styles.condensedHeader}>PREV RIDES</Text>
        <Text style={styles.condensedText} numberOfLines={1}>
            3rd · +0:08 to 2nd
        </Text>
    </View>
);

const PhoneFrame = ({ width, height, children }: { width: number; height: number; children: React.ReactNode }) => (
    <View style={[styles.frame, { width, height }]}>
        <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {children}
    </View>
);

// --- Reference frame: 844×390 ---

export const CollapsedCondensed: Story = {
    render: () => (
        <PhoneFrame width={844} height={390}>
            <PrevRidesCornerPanel active={true} slotRect={fallbackSlot(844, 390)} screenHeight={390} rows={MOCK_ROWS}>
                <CondensedLine />
            </PrevRidesCornerPanel>
        </PhoneFrame>
    ),
};

/** Same frame, `active: false` — the cornerWidget cycle is on `'elevation'`/`'workout'`, so no
 *  chevron renders at all (it's a separate tap target only ever shown while the cycle is on
 *  `'prevRides'`). */
export const CollapsedNotActive: Story = {
    render: () => (
        <PhoneFrame width={844} height={390}>
            <PrevRidesCornerPanel active={false} slotRect={fallbackSlot(844, 390)} screenHeight={390} rows={MOCK_ROWS}>
                <CondensedLine />
            </PrevRidesCornerPanel>
        </PhoneFrame>
    ),
};

export const Expanded: Story = {
    render: () => (
        <PhoneFrame width={844} height={390}>
            <PrevRidesCornerPanel
                active={true}
                defaultExpanded={true}
                slotRect={fallbackSlot(844, 390)}
                screenHeight={390}
                rows={MOCK_ROWS}
            >
                <CondensedLine />
            </PrevRidesCornerPanel>
        </PhoneFrame>
    ),
};

/** A short field (current + one other rider) — the panel sizes to the data it has, it doesn't pad
 *  out empty rows to fill the budget. */
export const ExpandedShortField: Story = {
    render: () => (
        <PhoneFrame width={844} height={390}>
            <PrevRidesCornerPanel
                active={true}
                defaultExpanded={true}
                slotRect={fallbackSlot(844, 390)}
                screenHeight={390}
                rows={[MOCK_ROW_CHASER, MOCK_ROW_CURRENT]}
            >
                <CondensedLine />
            </PrevRidesCornerPanel>
        </PhoneFrame>
    ),
};

// --- Tighter frame: confirms the panel clamps rather than overflowing into the bottom bar ---

const TIGHT_WIDTH = 700;
const TIGHT_HEIGHT = 300;

export const ExpandedTightFrameClamps: Story = {
    render: () => (
        <PhoneFrame width={TIGHT_WIDTH} height={TIGHT_HEIGHT}>
            <PrevRidesCornerPanel
                active={true}
                defaultExpanded={true}
                slotRect={fallbackSlot(TIGHT_WIDTH, TIGHT_HEIGHT)}
                screenHeight={TIGHT_HEIGHT}
                rows={MOCK_ROWS}
            >
                <CondensedLine />
            </PrevRidesCornerPanel>
        </PhoneFrame>
    ),
};

const styles = StyleSheet.create({
    frame: {
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: colors.background,
    },
    condensedLine: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    condensedHeader: {
        color: colors.text,
        fontSize: textSizes.microText,
        fontWeight: '700',
        opacity: 0.7,
    },
    condensedText: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
    },
});
