import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { PrevRidesRow } from './PrevRidesRow';
import { MOCK_ROW_LEADER, MOCK_ROW_CURRENT, MOCK_ROW_LAST, MOCK_ROW_MINIMAL } from './PrevRidesRow.mock';
import { colors } from '../../theme';

/**
 * Tier-aware previous-rides row. `'normal'` (tablet ear) renders full desktop parity; `'compact'`
 * (phone corner-slot/expanded panel) renders position/label/time-gap only, regardless of what
 * else the row data carries. Frames below are fixed, landscape-oriented, and sized close to the
 * narrow columns this row actually renders inside on device — a ~220dp-wide side column for the
 * tablet tier, a ~170dp-wide corner slot for the phone tier — so truncation/overflow show up here
 * the same way they would on a real ride screen.
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
            <Story />
        </View>
    ),
];

const phoneDecorator = [
    (Story: React.ComponentType) => (
        <View style={styles.phoneFrame}>
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
    tabletFrame: {
        width: 220,
        minHeight: 44,
        paddingVertical: 4,
        backgroundColor: colors.background,
    },
    phoneFrame: {
        width: 169,
        minHeight: 24,
        backgroundColor: colors.background,
    },
});
