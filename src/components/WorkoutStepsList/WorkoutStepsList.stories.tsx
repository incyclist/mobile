import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutStepsList } from './WorkoutStepsList';
import {
    MOCK_STEPS_VO2,
    MOCK_STEPS_MIXED_TARGETS,
    MOCK_STEPS_CADENCE_ONLY,
    MOCK_STEPS_RAMP,
    MOCK_STEPS_LAST,
    MOCK_STEPS_JUST_STARTED,
    MOCK_STEPS_REPEATED_SEGMENT,
    MOCK_STEPS_COMPACT_TRUNCATED,
    MOCK_STEPS_NONE,
} from './WorkoutStepsList.mock';
import { colors } from '../../theme/colors';

const meta: Meta<typeof WorkoutStepsList> = {
    title: 'Components/WorkoutStepsList',
    component: WorkoutStepsList,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutStepsList>;

/** Normal (tablet) density — mid-workout, previous + current + upcoming, more steps ahead. */
export const Normal: Story = {
    args: {
        steps: MOCK_STEPS_VO2,
    },
};

/** Compact (phone / short-screen) density — previous hidden, only 1 upcoming step shown. */
export const Compact: Story = {
    args: {
        steps: MOCK_STEPS_VO2,
        compact: true,
    },
};

/** Current step just started — the progress fill/marker sit right at the left edge. */
export const JustStarted: Story = {
    args: {
        steps: MOCK_STEPS_JUST_STARTED,
    },
};

/** Power + heartrate band target, plus a free (no-limit) upcoming step. */
export const MixedTargets: Story = {
    args: {
        steps: MOCK_STEPS_MIXED_TARGETS,
    },
};

/** Cadence-only target — no power at all, and no previous step (very first step of the workout). */
export const CadenceOnly: Story = {
    args: {
        steps: MOCK_STEPS_CADENCE_ONLY,
    },
};

/** A power ramp (progression) as the current step. */
export const Ramp: Story = {
    args: {
        steps: MOCK_STEPS_RAMP,
    },
};

/**
 * A repeated 2-step segment (40s work / 20s rest), flattened into individual rows per
 * repetition — proves the list shows "work, rest, work, rest, ..." rather than one row for the
 * whole segment.
 */
export const RepeatedSegment: Story = {
    args: {
        steps: MOCK_STEPS_REPEATED_SEGMENT,
    },
};

/** Last step of the workout — no upcoming steps left, shows the "end of workout" hint. */
export const LastStep: Story = {
    args: {
        steps: MOCK_STEPS_LAST,
    },
};

/**
 * Compact mode hides steps the service already sent (previous, and 2 of 3 upcoming) — the "more
 * steps ahead" hint should still show even though the service itself reports `hasMore: false`.
 */
export const CompactHidesMoreThanServiceSent: Story = {
    args: {
        steps: MOCK_STEPS_COMPACT_TRUNCATED,
        compact: true,
    },
};

/** Before start / after completion — renders nothing. */
export const NoCurrentStep: Story = {
    args: {
        steps: MOCK_STEPS_NONE,
    },
};

const styles = StyleSheet.create({
    decorator: {
        width: 320,
        padding: 16,
        backgroundColor: colors.background,
    },
});
