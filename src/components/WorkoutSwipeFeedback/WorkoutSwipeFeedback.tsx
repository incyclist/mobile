import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSwipeFeedbackProps } from './types';
import { colors } from '../../theme';

/**
 * Flash confirming a swipe gesture fired - paired with useWorkoutRideGestures.
 *
 * One design deliberately made to read on ANY background rather than two
 * per-mode flavours (review round 3, 2026-07-19): the workout-only ride screen
 * is near-black (where a borderless dark pill disappears), while Phase 2's
 * workout+route mode will put it over video/streetview/map (where a light pill
 * would wash out). A dark pill with a visible border + large type works on
 * both, and spares callers a variant prop they could set wrongly.
 *
 * Sits in the upper third of the screen, not dead center: on the workout ride
 * screen the center belongs to the graph (bars, power/HR lines, position
 * marker) - the band below the dashboard is the one reliably empty region.
 */
export const WorkoutSwipeFeedback = ({ visible, message }: WorkoutSwipeFeedbackProps) => {
    if (!visible) {
        return null;
    }

    return (
        <View style={styles.container} pointerEvents="none">
            <View style={styles.toast}>
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '18%',
        alignItems: 'center',
    },
    toast: {
        backgroundColor: 'rgba(25,25,25,0.85)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
        borderRadius: 12,
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    text: {
        color: colors.text,
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
