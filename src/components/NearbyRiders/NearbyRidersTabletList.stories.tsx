import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { NearbyRidersTabletList, NEARBY_RIDERS_TABLET_WIDTH } from './NearbyRidersTabletList';
import { MOCK_ROWS, MOCK_ROW_USER } from './NearbyRiderRow.mock';
import { colors, textSizes } from '../../theme';

/**
 * Tablet (non-compact) nearby-riders list — the left-ear counterpart to `PrevRides`'
 * `PrevRidesTabletList` (a local component inside `RideOverlay.tsx`), built here as a standalone,
 * exported component instead (see this component's own file-level doc for why — session plan 2.2
 * explicitly avoids touching `RideOverlay.tsx` before session 3.1's wiring exists).
 *
 * Independently sized: a fixed width (`NEARBY_RIDERS_TABLET_WIDTH`), never derived from a
 * sibling widget's geometry — these stories illustrate that by anchoring the list below a
 * stand-in `CornerMapSlot` placeholder of a *different*, unrelated width, proving the list's own
 * width doesn't change with it (`race-against-yourself-mobile-design.md` §6.2's As-built "Reuse
 * note for Nearby Riders").
 */
const meta: Meta<typeof NearbyRidersTabletList> = {
    title: 'Components/NearbyRiders/NearbyRidersTabletList',
    component: NearbyRidersTabletList,
};

export default meta;

type Story = StoryObj<typeof NearbyRidersTabletList>;

const CORNER_MAP_WIDTH = 260;
const CORNER_MAP_HEIGHT = 200;
const CORNER_MAP_TOP = 24;

const CornerMapSlot = () => (
    <View style={[styles.cornerMap, { top: CORNER_MAP_TOP, width: CORNER_MAP_WIDTH, height: CORNER_MAP_HEIGHT }]}>
        <Text style={styles.cornerMapLabel}>corner map</Text>
    </View>
);

const TabletFrame = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.frame}>
        <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {children}
    </View>
);

// Anchored below CornerMapSlot's bottom edge — same "vertical position only is ear-relative"
// convention the tablet ear's real As-built geometry uses (RideOverlay.tsx's
// prevRidesAnchorBottom); width is always the fixed constant, regardless of the map's own width.
const listStyle = {
    top: CORNER_MAP_TOP + CORNER_MAP_HEIGHT + 8,
    right: 0,
    width: NEARBY_RIDERS_TABLET_WIDTH,
};

/** Several riders — the representative field, avatar/name/stats/gap all visible on every row. */
export const SeveralRiders: Story = {
    render: () => (
        <TabletFrame>
            <CornerMapSlot />
            <NearbyRidersTabletList rows={MOCK_ROWS} style={listStyle} />
        </TabletFrame>
    ),
};

/** A single rider — the list sizes to its content, no padded-out empty rows. */
export const SingleRider: Story = {
    render: () => (
        <TabletFrame>
            <CornerMapSlot />
            <NearbyRidersTabletList rows={[MOCK_ROW_USER]} style={listStyle} />
        </TabletFrame>
    ),
};

/** An empty list — renders nothing below the corner map, no placeholder/empty-state chrome (a
 *  session 3.1 wiring concern owns whether the list mounts at all when there are zero riders). */
export const EmptyList: Story = {
    render: () => (
        <TabletFrame>
            <CornerMapSlot />
            <NearbyRidersTabletList rows={[]} style={listStyle} />
        </TabletFrame>
    ),
};

const styles = StyleSheet.create({
    frame: {
        width: 1180,
        height: 820,
        alignSelf: 'flex-start',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: colors.background,
    },
    cornerMap: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cornerMapLabel: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
        opacity: 0.6,
    },
});
