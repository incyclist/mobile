import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutGraphView } from './WorkoutGraphView';
import { MOCK_PLAN, MOCK_PLAN_SHORT } from './mockData';
import { colors } from '../../theme/colors';

/**
 * Session-1.3 spike stories. Proves the SVG rendering approach across the two
 * modes in scope: `strip` (list-row thumbnail — bars only, no FTP line, no axes)
 * and `detail` (full — bars + FTP reference line + light axes). `live` mode is
 * deferred to session 3.1.
 *
 * Stories drive the pure WorkoutGraphView with explicit pixel sizes (the smart
 * WorkoutGraph wrapper's onLayout measurement doesn't resolve under the
 * react-native-web Storybook renderer, matching how ActivityGraphPreview stories
 * are written).
 */
const meta: Meta<typeof WorkoutGraphView> = {
    title: 'Components/WorkoutGraph',
    component: WorkoutGraphView,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutGraphView>;

/** strip mode — as embedded in a WorkoutItem list row. */
export const Strip: Story = {
    args: {
        mode: 'strip',
        plan: MOCK_PLAN,
        width: 350,
        height: 44,
    },
};

/** strip mode at a small / short-workout size. */
export const StripShort: Story = {
    args: {
        mode: 'strip',
        plan: MOCK_PLAN_SHORT,
        width: 220,
        height: 36,
    },
};

/** detail mode — as shown in the WorkoutDetailsDialog. */
export const Detail: Story = {
    args: {
        mode: 'detail',
        plan: MOCK_PLAN,
        width: 360,
        height: 200,
    },
};

/** detail mode, FTP line above every bar (verifies clamp when ftp > yMax bars). */
export const DetailLowIntensity: Story = {
    args: {
        mode: 'detail',
        plan: MOCK_PLAN_SHORT,
        width: 360,
        height: 200,
    },
};

/**
 * Side-by-side render of a mocked WorkoutItem row: name + a strip graph, showing
 * how the thumbnail reads at row scale next to text.
 */
export const InListRow: Story = {
    render: () => (
        <View style={styles.row}>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>VO2 Max Builder</Text>
                <Text style={styles.rowSub}>35 min · Intervals</Text>
            </View>
            <View style={styles.rowGraph}>
                <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={160} height={40} />
            </View>
        </View>
    ),
};

const styles = StyleSheet.create({
    decorator: {
        width: 420,
        minHeight: 120,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 380,
        padding: 12,
        borderRadius: 8,
        backgroundColor: colors.listItemBackground,
    },
    rowText: {
        flex: 1,
    },
    rowTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    rowSub: {
        color: colors.text,
        opacity: 0.7,
        fontSize: 12,
        marginTop: 2,
    },
    rowGraph: {
        width: 160,
    },
});
