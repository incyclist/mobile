import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { NearbyRiderRow } from './NearbyRiderRow';
import {
    MOCK_ROW_AHEAD,
    MOCK_ROW_BEHIND,
    MOCK_ROW_USER,
    MOCK_ROW_PAUSED,
    MOCK_ROW_COACH,
    MOCK_ROW_NO_STATS,
    MOCK_ROWS,
} from './NearbyRiderRow.mock';
import { colors } from '../../theme';

/**
 * Nearby-riders (group ride) row — one shape, used identically by both the tablet ear and the
 * phone corner panel (design doc §5.2, session plan 2.1). Unlike `PrevRidesRow`, there is no
 * `layout` prop here: every field renders regardless of where the row is mounted. The frame below
 * is a fixed, illustrative panel width — the real panel width is owned by the session 2.2 panel
 * components, not this row.
 */
const meta: Meta<typeof NearbyRiderRow> = {
    title: 'Components/NearbyRiders/NearbyRiderRow',
    component: NearbyRiderRow,
};

export default meta;

type Story = StoryObj<typeof NearbyRiderRow>;

const panelDecorator = [
    (Story: React.ComponentType) => (
        <View style={styles.panelFrame}>
            <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Story />
        </View>
    ),
];

export const RiderAhead: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_AHEAD,
};

export const RiderBehind: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_BEHIND,
};

/** The current user's own row — accent-highlighted, no gap value shown. */
export const CurrentUser: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_USER,
};

/** Dimmed, with an explicit "PAUSED" indicator. */
export const PausedRider: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_PAUSED,
};

/** Rendered like any other rider, with a "COACH" indicator (mobile has no distinct coach avatar
 *  asset — see `NearbyRiderRow.tsx`'s file-level comment for why this departs from web-ui). */
export const Coach: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_COACH,
};

/** No power/speed data — those stat slots are simply absent, not a dash/placeholder. */
export const NoPowerOrSpeed: Story = {
    decorators: panelDecorator,
    args: MOCK_ROW_NO_STATS,
};

/** The full representative set stacked together, as it would appear inside a panel — varying gap
 *  sign/magnitude, the current-user accent among other rows, paused/coach indicators. */
export const RepresentativeSet: Story = {
    decorators: panelDecorator,
    render: () => (
        <>
            {MOCK_ROWS.map((row, index) => (
                <NearbyRiderRow key={index} {...row} />
            ))}
        </>
    ),
};

const styles = StyleSheet.create({
    // 300dp is illustrative, not a spec'd value — the real panel width is owned by the session 2.2
    // panel components (tablet ear / phone corner panel), not this row.
    panelFrame: {
        width: 300,
        minHeight: 56,
        paddingVertical: 4,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
});
