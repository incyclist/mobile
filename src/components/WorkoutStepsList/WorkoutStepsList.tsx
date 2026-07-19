import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';
import { formatTime } from 'incyclist-services';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { POSITION_MARKER_COLOR } from '../WorkoutGraph';
import { WorkoutStepDisplay, WorkoutStepsListProps } from './types';

/**
 * Compact "Zwift-style" upcoming-steps panel for the workout ride screen
 * (workout-ride-page-service-design.md §3.2). Pure view: renders whatever
 * `previous`/`current`/`upcoming` it is given — the page service already
 * builds these from the flattened (repeat-expanded) step sequence, and caps
 * `upcoming` at the next 2-3 steps.
 *
 * The current row's own highlight + elapsed-progress fill *is* the "which
 * step is active" marker — there is deliberately no separate pointer/triangle
 * on top of it.
 */
export const WorkoutStepsList = ({ steps, compact = false, style }: WorkoutStepsListProps) => {
    const { previous, current, upcoming, hasMore } = steps ?? { previous: null, current: null, upcoming: [], hasMore: false };
    const visibleUpcoming = compact ? upcoming.slice(0, 1) : upcoming;
    const showPrevious = !!previous && !compact;
    // "More to come" beyond what's on screen — either the service already knows there's more
    // past the 2-3 it sent (hasMore), or compact mode itself is hiding some of what was sent.
    const moreBeyondVisible = hasMore || upcoming.length > visibleUpcoming.length;
    const showEndHint = !!current;

    if (!current && visibleUpcoming.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            {showPrevious && <PreviousRow step={previous as WorkoutStepDisplay} />}
            {current && <CurrentRow step={current} compact={compact} />}
            {visibleUpcoming.map((step, index) => (
                <UpcomingRow key={`${step.label}-${index}`} step={step} compact={compact} />
            ))}
            {showEndHint && (
                <View style={styles.row}>
                    <Text style={[styles.endHint, compact && styles.endHintCompact]}>
                        {moreBeyondVisible ? '⋯ more steps ahead' : 'Last step — end of workout'}
                    </Text>
                </View>
            )}
        </View>
    );
};

// Already-completed step, shown above the current row. Dimmer than an upcoming row — same shape,
// clearly "done" rather than "not yet done".
const PreviousRow = ({ step }: { step: WorkoutStepDisplay }) => (
    <View style={[styles.row, styles.previousRow]}>
        <Text style={styles.previousLabel} numberOfLines={1}>
            {step.label}
        </Text>
        <Text style={styles.previousDuration}>{formatTime(step.duration, true)}</Text>
    </View>
);

// The step's own elapsed fraction — drawn as the row's background fill, with a thin marker line
// at the fill's leading edge, colored to match WorkoutGraph's `live`-mode position marker (same
// "where am I" visual language, just horizontal-in-a-row instead of vertical-across-a-timeline).
const CurrentRow = ({ step, compact }: { step: WorkoutStepDisplay; compact: boolean }) => {
    const hasProgress = step.remaining !== null && step.duration > 0;
    const progress = hasProgress
        ? Math.min(1, Math.max(0, 1 - (step.remaining as number) / step.duration))
        : 0;
    const progressPct = `${(progress * 100).toFixed(2)}%` as DimensionValue;

    return (
        <View style={[styles.row, styles.currentRow]}>
            {hasProgress && <View style={[styles.progressFill, { width: progressPct }]} />}
            {hasProgress && <View style={[styles.progressMarker, { left: progressPct }]} />}
            <View style={styles.currentAccent} />
            <View style={styles.rowText}>
                <Text style={[styles.currentLabel, compact && styles.currentLabelCompact]} numberOfLines={1}>
                    {step.label}
                </Text>
            </View>
            {step.remaining !== null && (
                <Text style={[styles.remaining, compact && styles.remainingCompact]}>
                    -{formatTime(step.remaining, true)}
                </Text>
            )}
        </View>
    );
};

const UpcomingRow = ({ step, compact }: { step: WorkoutStepDisplay; compact: boolean }) => (
    <View style={styles.row}>
        <Text style={[styles.upcomingLabel, compact && styles.upcomingLabelCompact]} numberOfLines={1}>
            {step.label}
        </Text>
        <Text style={[styles.upcomingDuration, compact && styles.upcomingDurationCompact]}>
            {formatTime(step.duration, true)}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.listItemBackground,
        borderRadius: 8,
        paddingVertical: 4,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 8,
    },
    previousRow: {
        opacity: 0.7,
    },
    previousLabel: {
        flex: 1,
        color: colors.text,
        opacity: 0.4,
        fontSize: textSizes.subtitle,
        fontWeight: '500',
        textDecorationLine: 'line-through',
    },
    previousDuration: {
        color: colors.text,
        opacity: 0.4,
        fontSize: textSizes.subtitle,
    },
    currentRow: {
        position: 'relative',
        backgroundColor: 'rgba(221, 153, 51, 0.18)',
        overflow: 'hidden',
    },
    // Elapsed-fraction fill, drawn as the row's own background — deliberately behind the text
    // (no extra vertical space for a separate progress bar).
    progressFill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 229, 255, 0.16)',
    },
    // Leading edge of the fill — same color/role as WorkoutGraph's live-mode position marker.
    progressMarker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: POSITION_MARKER_COLOR,
    },
    currentAccent: {
        width: 4,
        alignSelf: 'stretch',
        borderRadius: 2,
        backgroundColor: colors.selected,
    },
    rowText: {
        flex: 1,
    },
    currentLabel: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '700',
    },
    currentLabelCompact: {
        fontSize: textSizes.subtitle,
    },
    remaining: {
        color: colors.selected,
        fontSize: textSizes.normalText,
        fontWeight: '700',
    },
    remainingCompact: {
        fontSize: textSizes.subtitle,
    },
    upcomingLabel: {
        flex: 1,
        color: colors.text,
        opacity: 0.6,
        fontSize: textSizes.subtitle,
        fontWeight: '500',
    },
    upcomingLabelCompact: {
        fontSize: textSizes.smallText,
    },
    upcomingDuration: {
        color: colors.text,
        opacity: 0.6,
        fontSize: textSizes.subtitle,
    },
    upcomingDurationCompact: {
        fontSize: textSizes.smallText,
    },
    endHint: {
        flex: 1,
        color: colors.disabled,
        fontSize: textSizes.subtitle,
        fontWeight: '500',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    endHintCompact: {
        fontSize: textSizes.smallText,
    },
});
