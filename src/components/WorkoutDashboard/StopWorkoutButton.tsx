import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { useLogging } from '../../hooks';

export interface StopWorkoutButtonProps {
    onPress: () => void;
    /** Matches useScreenLayout()==='compact' — same convention as WorkoutDashboard's own prop. */
    compact?: boolean;
    disabled?: boolean;
}

/**
 * "Stop Workout, keep riding" (workout-mobile-hld-phase2.md §6.3/§8.3, session 5.3). Single tap,
 * no pre-confirm dialog, no undo window — the button is small, isolated from the Menu button, and
 * distinct enough (repo-owner review) that an accidental tap isn't a realistic risk here, unlike a
 * swipe/gesture control.
 *
 * Deliberately small and single-purpose (≈56×44, §8.3's prototype sizing) — sized against
 * `WorkoutDashboard`'s reserved third `controls` column (session 3.1), not the app's standard
 * `Button` (32/16 dp padding, far too big for that slot). A red-tinted glyph/border (`colors.error`)
 * keeps it visually distinct from — and physically away from — the primary/orange Menu button, per
 * §8.3's explicit requirement. Ported from the session 4.1 prototype's `StopWorkoutButton`
 * (`RideOverlayPrototype.stories.tsx`), which rendered every arrangement including the fallback and
 * found this mechanism has a home everywhere (§8.3's decision).
 */
export const StopWorkoutButton = ({ onPress, compact = false, disabled = false }: StopWorkoutButtonProps) => {
    // This button doesn't go through ButtonBar's `Button` (too big for the reserved controls
    // slot, see the size rationale above), which is where 'button clicked' logging normally comes
    // from — so it needs its own, matching ButtonBar's exact event shape/wording.
    const { logEvent } = useLogging('Incyclist');

    const onPressLogged = () => {
        logEvent({ message: 'button clicked', button: 'Stop Workout', eventSource: 'user' });
        onPress();
    };

    return (
        <Pressable
            testID="stop-workout-button"
            style={[styles.button, compact && styles.buttonCompact, disabled && styles.buttonDisabled]}
            onPress={onPressLogged}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Stop Workout"
        >
            <View style={styles.glyph} />
            <Text style={[styles.label, compact && styles.labelCompact]}>Stop{'\n'}Workout</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        minWidth: 56,
        minHeight: 44,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.error,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    buttonCompact: {
        minWidth: 48,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    glyph: {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: colors.error,
    },
    label: {
        color: colors.text,
        fontSize: 10,
        lineHeight: 11,
        textAlign: 'center',
    },
    labelCompact: {
        fontSize: 9,
        lineHeight: 10,
    },
});
