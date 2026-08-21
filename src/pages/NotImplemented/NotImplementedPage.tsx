import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors, textSizes } from '../../theme';
import { useIncyclist } from 'incyclist-services';
import { TransitionShell, ScheduledWorkoutPromptModal, TNavigationItem } from '../../components';
import { getUIBinding } from '../../bindings/ui';
import { navigate } from '../../services';
import { useScheduledWorkoutPrompt } from '../../hooks/workouts';

interface NotImplementedViewProps {
    onClick: (item: TNavigationItem) => void;
    selected: TNavigationItem;
}

export const NotImplementedView = ({ onClick, selected }: NotImplementedViewProps) => (
    <TransitionShell selected={selected} onClick={onClick}>
        <Text style={styles.message}>Not yet implemented</Text>
    </TransitionShell>
);

const styles = StyleSheet.create({
    message: {
        color: colors.text,
        fontSize: textSizes.noDataText,
    },
});

export const NotImplementedPage = ({ selected }: { selected?: TNavigationItem }) => {
    const incyclist = useIncyclist();
    const route = useRoute();
    // This component doubles as both the `main` and `user` screens (RootNavigator.tsx) - the
    // post-pairing scheduled-workout prompt (workout-mobile-hld.md §3.1/§5) is only specced for
    // `main`, not `user`, so it's gated on the actual route name rather than always running.
    const { prompt: scheduledWorkoutPrompt, onYes: onScheduledWorkoutYes, onNo: onScheduledWorkoutNo, onCheckWorkouts: onScheduledWorkoutCheck } = useScheduledWorkoutPrompt(route.name === 'main');

    const onClick = (item: TNavigationItem) => {
        if (item === 'exit') {
            incyclist.onAppExit()
                .then(() => { getUIBinding().quit(); });
        }
        else
            navigate(item);
    };
    return (
        <>
            <NotImplementedView selected={selected!} onClick={onClick} />
            {scheduledWorkoutPrompt && (
                <ScheduledWorkoutPromptModal
                    visible
                    title={scheduledWorkoutPrompt.title}
                    onYes={onScheduledWorkoutYes}
                    onNo={onScheduledWorkoutNo}
                    onCheckWorkouts={onScheduledWorkoutCheck}
                />
            )}
        </>
    );
};