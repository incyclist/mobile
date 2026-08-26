import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutSettingsDialogViewProps } from './types';
import { Dialog } from '../Dialog';
import { EditNumber } from '../EditNumber';
import { BinarySelect } from '../BinarySelect';

// First version scoped to just the load-increment control (workout-mobile-hld.md §3.2) - mid-ride
// FTP editing was considered and deferred, it overlaps with WorkoutDetailsDialog's pre-ride FTP
// override and needs its own design pass, not a bolt-on here.
const MIN_LOAD_INCREMENT = 1;
const MAX_LOAD_INCREMENT = 20;

export const WorkoutSettingsDialogView = ({
    loadIncrement,
    stepChangeAudioSignal,
    onClose,
    onChangeLoadIncrement,
    onChangeStepChangeAudioSignal,
}: WorkoutSettingsDialogViewProps) => {
    const handleChange = useCallback((value: number | undefined) => {
        if (value === undefined) {
            return;
        }
        onChangeLoadIncrement(value);
    }, [onChangeLoadIncrement]);

    const handleStepChangeAudioSignalChange = useCallback((value: boolean) => {
        onChangeStepChangeAudioSignal(value);
    }, [onChangeStepChangeAudioSignal]);

    return (
        <Dialog
            title="Workout Settings"
            variant="details"
            onOutsideClick={onClose}
            buttons={[{ label: 'Close', primary: true, onClick: onClose }]}
        >
            <EditNumber
                label="Load Increment"
                value={loadIncrement}
                min={MIN_LOAD_INCREMENT}
                max={MAX_LOAD_INCREMENT}
                digits={0}
                unit="%"
                onValueChange={handleChange}
            />
            <View style={styles.field}>
                <BinarySelect
                    label="Step Change Audio"
                    labelPosition="before"
                    labelWidth={140}
                    value={stepChangeAudioSignal}
                    trueLabel="On"
                    falseLabel="Off"
                    onValueChange={handleStepChangeAudioSignalChange}
                />
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    field: {
        marginTop: 15,
    },
});
