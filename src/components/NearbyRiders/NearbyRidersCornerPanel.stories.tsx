import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { NearbyRidersCornerPanel } from './NearbyRidersCornerPanel';
import { MOCK_ROWS, MOCK_ROW_USER } from './NearbyRiderRow.mock';
import { NearbyRidersSlotRect } from './types';
import { computeRideOverlayLayout } from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';

/**
 * Phone-only nearby-riders panel — built to `PrevRidesCornerPanel`'s exact shipped (As-built,
 * not originally-planned) pattern (design doc §5.2, session plan 2.2): anchored below the
 * elevation/workout corner slot, never overlapping it, defaulting to expanded, driven only by an
 * explicit chevron. Pure view, no `incyclist-services` dependency: `rows`/`slotRect` are plain
 * props, `onExpandNearbyRiders`/`onCollapseNearbyRiders`/`onVisibleRowsChange` are component-level
 * callbacks — real `RidePageService` wiring is session 3.1's job.
 *
 * The corner slot itself is not owned by this component — a stand-in `CornerSlot` placeholder
 * gives the panel a realistic backdrop to anchor below, matching how `RideOverlay.tsx` will mount
 * the two independently once wired (session 3.1). Unlike `PrevRides` (right ear/corner-slot
 * sibling), this feature is left-ear positioned once wired — but the panel itself is
 * position-agnostic (this session's explicit scope), so these stories anchor it below an
 * illustrative slot rect the same way `PrevRidesCornerPanel`'s own stories do.
 */
const meta: Meta<typeof NearbyRidersCornerPanel> = {
    title: 'Components/NearbyRiders/NearbyRidersCornerPanel',
    component: NearbyRidersCornerPanel,
    args: {
        onExpandNearbyRiders: fn(),
        onCollapseNearbyRiders: fn(),
        onVisibleRowsChange: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof NearbyRidersCornerPanel>;

const FALLBACK_SLOT_DEFAULT = (screenWidth: number, screenHeight: number): NearbyRidersSlotRect => ({
    top: 0,
    right: 0,
    width: screenWidth * 0.2,
    height: screenHeight * 0.12,
});

const fallbackSlot = (screenWidth: number, screenHeight: number): NearbyRidersSlotRect => {
    const layout = computeRideOverlayLayout({ screenWidth, screenHeight, screenLayout: 'compact', mapVisible: false });
    return layout.elevation ?? FALLBACK_SLOT_DEFAULT(screenWidth, screenHeight);
};

const CornerSlot = ({ slotRect }: { slotRect: NearbyRidersSlotRect }) => (
    <View
        style={[
            styles.cornerSlot,
            { top: slotRect.top, right: slotRect.right, width: slotRect.width, height: slotRect.height },
        ]}
    >
        <Text style={styles.cornerSlotLabel}>elevation</Text>
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
    render: (args) => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={390} rows={MOCK_ROWS} />
            </PhoneFrame>
        );
    },
};

/** Collapsed — just the elevation preview and a small chevron button below it, no row data. */
export const Collapsed: Story = {
    render: (args) => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={390} rows={MOCK_ROWS} defaultExpanded={false} />
            </PhoneFrame>
        );
    },
};

/** A single rider — the panel sizes to the data it has, it doesn't pad out empty rows. */
export const SingleRider: Story = {
    render: (args) => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={390} rows={[MOCK_ROW_USER]} />
            </PhoneFrame>
        );
    },
};

/** An empty list — the header still renders, no rider rows underneath it (§5.1: eligibility for
 *  mounting this panel at all is a session 3.1 wiring concern; this story just confirms the panel
 *  itself doesn't break on zero rows). */
export const EmptyList: Story = {
    render: (args) => {
        const slotRect = fallbackSlot(844, 390);
        return (
            <PhoneFrame width={844} height={390}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={390} rows={[]} />
            </PhoneFrame>
        );
    },
};

/** A rider joining mid-ride — from one row to several, proving the panel re-sizes to the new
 *  data rather than staying pinned to whatever budget the first render computed. */
export const RiderJoins: Story = {
    render: (args) => {
        const slotRect = fallbackSlot(844, 390);
        const [rows, setRows] = React.useState([MOCK_ROW_USER]);
        return (
            <PhoneFrame width={844} height={390}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={390} rows={rows} />
                <View style={styles.debugButton}>
                    <Text style={styles.cornerSlotLabel} onPress={() => setRows(MOCK_ROWS)}>
                        + rider joins
                    </Text>
                </View>
            </PhoneFrame>
        );
    },
};

// --- Tighter frame: confirms the panel clamps rather than overflowing into the bottom bar ---

const TIGHT_WIDTH = 700;
const TIGHT_HEIGHT = 300;

export const ExpandedTightFrameClamps: Story = {
    render: (args) => {
        const slotRect = fallbackSlot(TIGHT_WIDTH, TIGHT_HEIGHT);
        return (
            <PhoneFrame width={TIGHT_WIDTH} height={TIGHT_HEIGHT}>
                <CornerSlot slotRect={slotRect} />
                <NearbyRidersCornerPanel {...args} slotRect={slotRect} screenHeight={TIGHT_HEIGHT} rows={MOCK_ROWS} />
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
    cornerSlot: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cornerSlotLabel: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.6,
    },
    debugButton: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
});
