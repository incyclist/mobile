import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, textSizes } from '../../theme';

export interface StopWorkoutToastProps {
    onUndo: () => void;
}

/**
 * "Workout stopped — Undo" (workout-mobile-hld-phase2.md §8.3). Purely presentational — how long
 * it stays on screen and what `onUndo` actually does are `WorkoutRideOverlay`'s concern (session
 * 5.3), not this component's. A short, non-blocking toast rather than a modal, per §8.3's explicit
 * "no pre-confirm dialog" requirement — the confirmation happens *after* the tap, not before it.
 */
export const StopWorkoutToast = ({ onUndo }: StopWorkoutToastProps) => (
    <View testID="stop-workout-toast" style={styles.container}>
        <Text style={styles.text}>Workout stopped</Text>
        <Pressable
            testID="stop-workout-toast-undo"
            onPress={onUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            hitSlop={8}
        >
            <Text style={styles.undo}>Undo</Text>
        </Pressable>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.subtitle,
    },
    undo: {
        color: colors.tileActive,
        fontSize: textSizes.subtitle,
        fontWeight: '700',
    },
});
