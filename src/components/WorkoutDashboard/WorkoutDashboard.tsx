import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutGraph } from '../WorkoutGraph';
import { WorkoutStepsList } from '../WorkoutStepsList';
import { colors, textSizes } from '../../theme';
import { WorkoutDashboardProps } from './types';

const GRAPH_HEIGHT = 160;
const GRAPH_HEIGHT_COMPACT = 120;

/**
 * `WorkoutDashboard` — the second floating overlay widget on the combined route+workout ride
 * screen (workout-mobile-hld-phase2.md §5.3), sitting below `RideDashboard`. Purely
 * informational (§6.2): description, `WorkoutGraph`, next-steps summary — no step/load
 * controls, swipe already covers that reliably. A pure view: all data comes in via props,
 * nothing here subscribes to a ride observer — the caller (eventually `RidePageService`'s
 * display props, wired in a later Wave 5 session) already computes `graph`/`steps`/`actuals`
 * on its own `page-update`/`data-update` cadence, same split as `WorkoutGraph`'s
 * plan/actuals props.
 *
 * `graphHeight`/`graphMode` exist purely as an experimentation knob for the Wave 4 prototype
 * session (§8, open question 4) — this component makes no judgment on the "right" size/mode,
 * it just forwards whatever it's given (defaulting to a sensible live-mode size).
 */
export const WorkoutDashboard = ({
    title,
    description,
    graph,
    actuals,
    steps,
    graphHeight,
    graphMode = 'live',
    compact = false,
    style,
}: WorkoutDashboardProps) => {
    const resolvedGraphHeight = graphHeight ?? (compact ? GRAPH_HEIGHT_COMPACT : GRAPH_HEIGHT);

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
                    {title}
                </Text>
                {!!description && (
                    <Text
                        testID="workout-dashboard-description"
                        style={[styles.description, compact && styles.descriptionCompact]}
                        numberOfLines={compact ? 1 : 2}
                    >
                        {description}
                    </Text>
                )}
            </View>
            <WorkoutGraph
                mode={graphMode}
                plan={graph}
                actuals={actuals}
                height={resolvedGraphHeight}
                style={styles.graph}
            />
            <WorkoutStepsList steps={steps} compact={compact} style={styles.steps} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 8,
        padding: 8,
        gap: 6,
    },
    header: {
        gap: 2,
    },
    title: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
    },
    titleCompact: {
        fontSize: textSizes.subtitle,
    },
    description: {
        color: colors.text,
        opacity: 0.8,
        fontSize: textSizes.subtitle,
        fontWeight: '400',
    },
    descriptionCompact: {
        fontSize: textSizes.smallText,
    },
    graph: {
        alignSelf: 'stretch',
    },
    steps: {
        alignSelf: 'stretch',
    },
});
