import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutGraphView } from './WorkoutGraphView';
import {
    MOCK_PLAN,
    MOCK_PLAN_SHORT,
    MOCK_PLAN_LIVE_MID,
    MOCK_ACTUALS_MID,
    MOCK_ACTUALS_NO_HRM,
    MOCK_PLAN_LIVE_SKIPBACK,
    MOCK_ACTUALS_SKIPBACK,
} from './WorkoutGraph.mock';
import { colors } from '../../theme/colors';

/**
 * Proves the SVG rendering approach across all 3 modes: `strip` (list-row
 * thumbnail — bars only, no FTP line, no axes), `detail` (full — bars + FTP
 * reference line + light axes), and `live` (ride screen — full-workout bars
 * with the recorded Power/HR overlay + position marker on top, session 3.1).
 *
 * The three `live` stories exist to verify specific behaviors: `Live` is a
 * mid-workout snapshot where the current workout still equals the pristine
 * plan; `LiveAfterSkipBack` is the *same* workout after a skip-back
 * re-inserted a step — `domain.x` visibly grows (compare the trailing x-axis
 * tick: 35:00 vs 40:00, workout-ride-page-service-design.md §3.0/§3.1) and
 * the first 9 bars are untouched, proving old bars aren't lost;
 * `LiveNoHeartRateMonitor` has no HR data at all, verifying the Heartrate
 * line/axis/legend all disappear cleanly rather than rendering broken.
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

/** live mode, mid-workout — full-workout bars with the recorded Power/HR overlay + position marker on top. */
export const Live: Story = {
    args: {
        mode: 'live',
        plan: MOCK_PLAN_LIVE_MID,
        actuals: MOCK_ACTUALS_MID,
        width: 360,
        height: 200,
        showAxes: true,
        showFtpLine: true,        
    },
};

/**
 * live mode, after a skip-back — same workout as `Live` above, but the rider
 * repeated the last VO2 on/off pair. `domain.x` grows [0,2100] -> [0,2400]
 * (compare the x-axis's last tick against `Live`), the re-inserted bars sit at
 * x=1800..2100, and `position` (2250) — past the pristine plan's old end —
 * only fits because the domain grew with it.
 */
export const LiveAfterSkipBack: Story = {
    args: {
        mode: 'live',
        plan: MOCK_PLAN_LIVE_SKIPBACK,
        actuals: MOCK_ACTUALS_SKIPBACK,
        width: 360,
        height: 200,
        showAxes: true,
        showFtpLine: true,
    },
};

/**
 * live mode, no HRM paired — not every rider rides with a heart-rate monitor.
 * Same mid-workout snapshot as `Live`, but `actuals.heartrate` is empty: the
 * Heartrate line, its yellow right-side axis, and its legend entry must all
 * disappear cleanly, while the Power line/axis and legend keep working on
 * their own — nothing should render as broken, empty, or zeroed-out.
 */
export const LiveNoHeartRateMonitor: Story = {
    args: {
        mode: 'live',
        plan: MOCK_PLAN_LIVE_MID,
        actuals: MOCK_ACTUALS_NO_HRM,
        width: 360,
        height: 200,
        showAxes: true,
        showFtpLine: true,
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
