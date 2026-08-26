export interface WorkoutSettingsDialogProps {
    onClose: () => void;
}

export interface WorkoutSettingsDialogViewProps {
    loadIncrement: number;
    /**
     * Workout Step Change Audio Signal feature - unlike loadIncrement above (proxied through
     * RidePageService.onSetLoadIncrement()), this is backed directly by useUserSettings() in the
     * smart WorkoutSettingsDialog, since it doesn't need live reactive propagation. Shared key with
     * WorkoutDetailsDialog's pre-ride toggle.
     */
    stepChangeAudioSignal: boolean;
    onClose: () => void;
    onChangeLoadIncrement: (value: number) => void;
    onChangeStepChangeAudioSignal: (value: boolean) => void;
}
