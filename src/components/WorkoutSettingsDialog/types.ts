export interface WorkoutSettingsDialogProps {
    onClose: () => void;
}

export interface WorkoutSettingsDialogViewProps {
    loadIncrement: number;
    onClose: () => void;
    onChangeLoadIncrement: (value: number) => void;
}
