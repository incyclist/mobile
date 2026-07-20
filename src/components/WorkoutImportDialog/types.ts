import { WorkoutImportDisplayProps } from 'incyclist-services';
import { ButtonProps } from '../ButtonBar/types';

export interface WorkoutImportDialogProps {
    onClose: () => void;
}

export interface WorkoutImportDialogViewProps {
    compact: boolean;
    displayProps: WorkoutImportDisplayProps;
    title: string;
    buttons: ButtonProps[];
    onOutsideClick?: () => void;
    onSetGroup: (group: string) => void;
    onPickFile: () => void;
}
