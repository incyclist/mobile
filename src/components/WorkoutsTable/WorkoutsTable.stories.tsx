import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutsTable } from './WorkoutsTable';
import { MainBackground } from '../MainBackground';
import {
    MOCK_CONTENT,
    MOCK_CONTENT_MANY_GROUPS,
    MOCK_CONTENT_EMPTY,
    mockScheduled,
} from './WorkoutsTable.mock';

const meta: Meta<typeof WorkoutsTable> = {
    title: 'Components/WorkoutsTable',
    component: WorkoutsTable,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={{ height: 700, width: 480 }}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
    args: {
        onSelectGroup: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutsTable>;

/** Tablet layout: full `WorkoutItem` (with graph) in both Upcoming and the flat list. */
export const Tablet: Story = {
    args: { data: MOCK_CONTENT, compact: false },
};

/** Phone layout: slim, graph-less Upcoming rows; the flat list is unaffected. */
export const Phone: Story = {
    args: { data: MOCK_CONTENT, compact: true },
};

/** 1 Upcoming entry <= collapsedCount: the "Show N more" toggle must not appear. */
export const SingleUpcomingEntry: Story = {
    args: {
        data: { ...MOCK_CONTENT, upcoming: { items: mockScheduled(1), collapsedCount: 2, todayId: 'sched-1' } },
        compact: false,
    },
};

/** upcoming:null -> the whole section is hidden, no dangling divider. */
export const NoUpcoming: Story = {
    args: { data: { ...MOCK_CONTENT, upcoming: null }, compact: false },
};

/** More than GroupPicker's 5-option chip threshold: filter row falls back to a SingleSelect
 *  dropdown. The wrapping `zIndex:10` is what keeps that dropdown above the rows below it. */
export const ManyGroups: Story = {
    args: { data: MOCK_CONTENT_MANY_GROUPS, compact: false },
};

/** A group filter selected but matching nothing: explicit "No workouts in this group", not a
 *  silent blank area. */
export const FilteredToZero: Story = {
    args: {
        data: { ...MOCK_CONTENT, groups: { ...MOCK_CONTENT.groups, selected: 'Climbing Prep' }, workouts: [] },
        compact: false,
    },
};

/** True-empty (no imported workouts at all): filter row hidden entirely; Upcoming (if any)
 *  still renders — isEmpty only concerns the imported library, not synced/scheduled workouts. */
export const EmptyState: Story = {
    args: { data: MOCK_CONTENT_EMPTY, compact: false },
};

/** True-empty, but with a workout scheduled today — Upcoming Training must still show. */
export const EmptyStateWithUpcoming: Story = {
    args: {
        data: { ...MOCK_CONTENT_EMPTY, upcoming: { items: mockScheduled(1), collapsedCount: 2, todayId: 'sched-1' } },
        compact: false,
    },
};
