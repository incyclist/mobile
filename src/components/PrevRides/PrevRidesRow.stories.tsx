import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PrevRidesRow } from './PrevRidesRow';
import { MOCK_ROW_LEADER, MOCK_ROW_CURRENT, MOCK_ROW_LAST, MOCK_ROW_MINIMAL } from './PrevRidesRow.mock';
import { colors } from '../../theme';

/**
 * Tier-aware previous-rides row. `'normal'` (tablet ear) renders full desktop parity; `'compact'`
 * (phone corner-slot/expanded panel) renders position/label/time-gap only, regardless of what
 * else the row data carries. Frames below are fixed and landscape-oriented, with a translucent
 * ride-screen backdrop (matching `WorkoutRideOverlay`'s story convention) since this row always
 * renders on top of the live Video/GPX view, never on an opaque background.
 *
 * The tablet frame's 320dp width is an illustrative preview size, not a spec'd value — the real
 * tablet ear width is computed by `useRideOverlayLayout()` from screen size and dashboard width,
 * not owned by this component, and no minimum width is currently reserved for PrevRides in that
 * algorithm. The phone frame's ~170dp corner slot is the one width this component actually has a
 * documented floor for.
 */
const meta: Meta<typeof PrevRidesRow> = {
    title: 'Components/PrevRides/PrevRidesRow',
    component: PrevRidesRow,
};

export default meta;

type Story = StoryObj<typeof PrevRidesRow>;

const tabletDecorator = [
    (Story: React.ComponentType) => (
        <View style={styles.tabletFrame}>
            <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Story />
        </View>
    ),
];

const phoneDecorator = [
    (Story: React.ComponentType) => (
        <View style={styles.phoneFrame}>
            <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Story />
        </View>
    ),
];

// --- normal (tablet ear) tier: full desktop parity ---

export const TabletLeader: Story = {
    decorators: tabletDecorator,
    args: { ...MOCK_ROW_LEADER, layout: 'normal' },
};

export const TabletCurrent: Story = {
    decorators: tabletDecorator,
    args: { ...MOCK_ROW_CURRENT, layout: 'normal' },
};

export const TabletLastPlace: Story = {
    decorators: tabletDecorator,
    args: { ...MOCK_ROW_LAST, layout: 'normal' },
};

/** No avatar and no heartrate on the row data — the avatar slot renders empty rather than a
 *  placeholder, and the heartrate stat is simply absent rather than showing a dash. */
export const TabletNoAvatarOrHeartrate: Story = {
    decorators: tabletDecorator,
    args: { ...MOCK_ROW_MINIMAL, layout: 'normal' },
};

/** Leader, current rider, and last place stacked together — the representative set this row type
 *  needs to read correctly side by side (varying gap sign/magnitude, the current-rider accent
 *  among non-current rows). */
export const TabletRepresentativeSet: Story = {
    decorators: tabletDecorator,
    render: () => (
        <>
            <PrevRidesRow {...MOCK_ROW_LEADER} layout="normal" />
            <PrevRidesRow {...MOCK_ROW_CURRENT} layout="normal" />
            <PrevRidesRow {...MOCK_ROW_LAST} layout="normal" />
        </>
    ),
};

// --- compact (phone) tier: position, label, time gap only ---

export const PhoneLeader: Story = {
    decorators: phoneDecorator,
    args: { ...MOCK_ROW_LEADER, layout: 'compact' },
};

export const PhoneCurrent: Story = {
    decorators: phoneDecorator,
    args: { ...MOCK_ROW_CURRENT, layout: 'compact' },
};

export const PhoneLastPlace: Story = {
    decorators: phoneDecorator,
    args: { ...MOCK_ROW_LAST, layout: 'compact' },
};

/** Same leader/current/last-place set as `TabletRepresentativeSet`, at the compact tier — proves
 *  the avatar/speed/power/heartrate/distanceGap fields those tablet rows show are suppressed here
 *  even though the underlying row data is identical (`MOCK_ROW_*` carries all fields regardless
 *  of tier; only this component decides what to render). */
export const PhoneRepresentativeSet: Story = {
    decorators: phoneDecorator,
    render: () => (
        <>
            <PrevRidesRow {...MOCK_ROW_LEADER} layout="compact" />
            <PrevRidesRow {...MOCK_ROW_CURRENT} layout="compact" />
            <PrevRidesRow {...MOCK_ROW_LAST} layout="compact" />
        </>
    ),
};

const styles = StyleSheet.create({
    // 280dp is illustrative, not a spec'd value — the real tablet ear width is computed by
    // useRideOverlayLayout() from screen size/dashboard width, not owned by this component. See
    // this story's file-level comment.
    tabletFrame: {
        width: 320,
        minHeight: 44,
        paddingVertical: 4,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
    phoneFrame: {
        width: 169,
        minHeight: 24,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
});
