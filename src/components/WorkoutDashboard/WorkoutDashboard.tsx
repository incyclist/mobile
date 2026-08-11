import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutGraph } from '../WorkoutGraph';
import { WorkoutStepsList } from '../WorkoutStepsList';
import { colors, textSizes } from '../../theme';
import { WorkoutDashboardProps } from './types';

const GRAPH_HEIGHT = 56;
const GRAPH_HEIGHT_COMPACT = 44;

/**
 * `WorkoutDashboard` — the compact "additional info" bar for a combined Video/GPX+workout ride
 * (workout-mobile-hld-phase2.md §5.3/§6.2). Not used on the dedicated Workout ride page. A pure
 * view: all data comes in via props, nothing here subscribes to a ride observer — the caller
 * (session 5.1) computes `line`/`graph`/`steps`/`actuals` on its own `page-update`/`data-update`
 * cadence, same split as `WorkoutGraph`'s plan/actuals props.
 */
export const WorkoutDashboard = ({
    line,
    graph,
    actuals,
    steps,
    controls,
    graphHeight,
    graphMode = 'strip',
    compact = false,
    style,
}: WorkoutDashboardProps) => {
    const resolvedGraphHeight = graphHeight ?? (compact ? GRAPH_HEIGHT_COMPACT : GRAPH_HEIGHT);

    return (
        <View style={[styles.container, style]}>
            <View style={styles.textBar}>
                <Text style={[styles.text, compact && styles.textCompact]} numberOfLines={1}>
                    {line.text}
                </Text>
            </View>
            <View style={styles.row}>
                <View style={styles.graphCol}>
                    <WorkoutGraph
                        mode={graphMode}
                        plan={graph}
                        actuals={actuals}
                        height={resolvedGraphHeight}
                        style={styles.graph}
                    />
                </View>
                <View style={styles.stepsCol}>
                    <WorkoutStepsList steps={steps} compact={compact} />
                </View>
                {controls && (
                    <View testID="workout-dashboard-controls" style={styles.controlsCol}>
                        {controls}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 8,
        padding: 6,
        gap: 4,
    },
    textBar: {
        alignItems: 'center',
    },
    text: {
        color: colors.text,
        fontSize: textSizes.subtitle,
        fontWeight: '700',
        textAlign: 'center',
    },
    textCompact: {
        fontSize: textSizes.smallText,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 6,
    },
    graphCol: {
        flex: 1,
        justifyContent: 'center',
    },
    graph: {
        alignSelf: 'stretch',
    },
    stepsCol: {
        flex: 2,
    },
    controlsCol: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
