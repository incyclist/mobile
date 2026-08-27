import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { formatTime } from 'incyclist-services';
import { colors } from '../../theme/colors';
import { textSizes } from '../../theme/textSizes';
import { POSITION_MARKER_COLOR } from '../WorkoutGraph';
import { WorkoutStepDisplay, WorkoutStepsListProps } from './types';
import { getCountdownBucket, hasStepJustStarted } from './utils';

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
export const WorkoutStepsList = ({ steps, compact = false, showEndHint: showEndHintProp = true, style }: WorkoutStepsListProps) => {
    const { previous, current, upcoming, hasMore } = steps ?? { previous: null, current: null, upcoming: [], hasMore: false };
    const visibleUpcoming = compact ? upcoming.slice(0, 1) : upcoming;
    const showPrevious = !!previous && !compact;
    // "More to come" beyond what's on screen — either the service already knows there's more
    // past the 2-3 it sent (hasMore), or compact mode itself is hiding some of what was sent.
    const moreBeyondVisible = hasMore || upcoming.length > visibleUpcoming.length;
    const showEndHint = !!current && showEndHintProp;

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

// Countdown-bucket scale pulse: brief "pop" on the remaining-time text, once per 4/3/2/1s bucket
// entered (not once per tick within the same bucket, since a 500ms update cadence can visit the
// same bucket several times).
const COUNTDOWN_PULSE_SCALE = 1.35;

// Step-start flash: brief full-row highlight the instant a new step begins - independently timed
// from the audio cue (useWorkoutStepAudioSignal, driven by the actual 'step-changed' event); see
// utils.ts's header comment for why these two are computed separately.
const FLASH_DURATION_MS = 400;

// Width of the progress marker line - kept as a constant (not just in the stylesheet) since the
// marker's `left` position must subtract it to land the marker's trailing edge, not its leading
// edge, at the computed progress point (see CurrentRow).
const MARKER_WIDTH = 2;

// The step's own elapsed fraction — drawn as the row's background fill, with a thin marker line
// at the fill's leading edge, colored to match WorkoutGraph's `live`-mode position marker (same
// "where am I" visual language, just horizontal-in-a-row instead of vertical-across-a-timeline).
//
// Also drives the countdown pulse/step-start flash (Workout Step Change Audio Signal feature) -
// computed locally from `step.remaining`/`step.duration`, already passed in every render, rather
// than a new prop threaded down from the services-layer countdown event (see utils.ts).
const CurrentRow = ({ step, compact }: { step: WorkoutStepDisplay; compact: boolean }) => {
    const hasProgress = step.remaining !== null && step.duration > 0;
    const progress = hasProgress
        ? Math.min(1, Math.max(0, 1 - (step.remaining as number) / step.duration))
        : 0;

    // Percentage width/left on a position:'absolute' child resolves against the parent's PADDING-
    // EXCLUDED content box in React Native's Yoga (a legacy "errata" left on by default) - since
    // `row` has paddingHorizontal, a "100%" fill/marker actually lands `paddingHorizontal*2` short
    // of the row's true right edge, even though the style prop itself is exactly '100.00%'.
    // Measuring the row via onLayout and computing raw pixel values instead sidesteps the
    // percentage-resolution path (and this quirk) entirely.
    const [rowWidth, setRowWidth] = useState(0);
    const onRowLayout = useCallback((e: LayoutChangeEvent) => {
        setRowWidth(e.nativeEvent.layout.width);
    }, []);
    const progressPx = progress * rowWidth;
    // The marker's own width must come off its `left` so its trailing (right) edge - not its
    // leading edge - lands at progressPx: otherwise at progress=1 the marker's left edge sits
    // exactly on the row's true right border and the marker renders almost entirely clipped by
    // currentRow's overflow:'hidden', instead of flush against it as expected.
    const markerLeft = Math.max(0, Math.min(progressPx - MARKER_WIDTH, rowWidth - MARKER_WIDTH));

    const remaining = step.remaining;
    const prevRemainingRef = useRef<number | null>(null);
    const prevBucketRef = useRef<number | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const prevRemaining = prevRemainingRef.current;
        const prevBucket = prevBucketRef.current;
        const bucket = getCountdownBucket(remaining, step.duration);

        if (bucket !== null && bucket !== prevBucket) {
            pulseAnim.setValue(COUNTDOWN_PULSE_SCALE);
            Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
        }

        if (hasStepJustStarted(remaining, prevRemaining)) {
            flashAnim.setValue(1);
            Animated.timing(flashAnim, { toValue: 0, duration: FLASH_DURATION_MS, useNativeDriver: true }).start();
        }

        prevRemainingRef.current = remaining;
        prevBucketRef.current = bucket;
    }, [remaining, step.duration, pulseAnim, flashAnim]);

    return (
        <View testID="step-current-row" style={[styles.row, styles.currentRow]} onLayout={onRowLayout}>
            {hasProgress && <View testID="step-progress-fill" style={[styles.progressFill, { width: progressPx }]} />}
            {hasProgress && <View testID="step-progress-marker" style={[styles.progressMarker, { left: markerLeft }]} />}
            <Animated.View
                testID="step-flash-overlay"
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.flashOverlay, { opacity: flashAnim }]}
            />
            <View style={styles.currentAccent} />
            <View style={styles.rowText}>
                <Text style={[styles.currentLabel, compact && styles.currentLabelCompact]} numberOfLines={1}>
                    {step.label}
                </Text>
            </View>
            {step.remaining !== null && (
                <Animated.Text
                    testID="step-remaining-text"
                    style={[styles.remaining, compact && styles.remainingCompact, { transform: [{ scale: pulseAnim }] }]}
                >
                    -{formatTime(step.remaining, true)}
                </Animated.Text>
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
        width: MARKER_WIDTH,
        backgroundColor: POSITION_MARKER_COLOR,
    },
    // Positioning comes from StyleSheet.absoluteFill, applied directly in the style array at the
    // usage site (RN's non-deprecated alternative to spreading absoluteFillObject in here) - this
    // entry only carries the flash's own color.
    flashOverlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
