import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSwipeFeedbackProps } from './types';
import { colors, textSizes } from '../../theme';

// Full-screen-centered flash confirming a swipe gesture fired - paired with useWorkoutRideGestures.
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
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toast: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.dialogTitle,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
