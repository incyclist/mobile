import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Dialog } from '../Dialog';
import { ButtonProps } from '../ButtonBar/types';
import { colors, textSizes } from '../../theme';
import { ScheduledWorkoutPromptProps } from './types';

/**
 * Post-pairing "you have a workout scheduled today" prompt (workout-mobile-hld.md §3.1/§5,
 * workout-list-page-service-design.md §11). Pure view - all trigger/guard/navigation logic
 * lives in `useScheduledWorkoutPrompt()`. Rendered by every content page except
 * `devices`/pairing.
 */
export const ScheduledWorkoutPromptModal = ({
    visible,
    title,
    onYes,
    onNo,
    onCheckWorkouts,
}: ScheduledWorkoutPromptProps) => {
    const buttons: ButtonProps[] = [
        { label: 'No', onClick: onNo },
        { label: 'Check workouts', onClick: onCheckWorkouts },
        { label: 'Yes', primary: true, onClick: onYes },
    ];

    return (
        <Dialog title="Scheduled Workout" variant="info" visible={visible} buttons={buttons} onOutsideClick={onNo}>
            <View style={styles.container}>
                <Text style={styles.message}>
                    You have <Text style={styles.bold}>{title}</Text> scheduled today - do you want to start it?
                </Text>
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    message: {
        color: colors.text,
        fontSize: textSizes.normalText,
    },
    bold: {
        fontWeight: 'bold',
    },
});
