import { ImportDisplayProps } from 'incyclist-services';
import { ButtonProps } from '../ButtonBar/types';

export interface RouteImportDialogProps {
    onClose: () => void;
}

export interface RouteImportDialogViewProps {
    compact: boolean;
    displayProps: ImportDisplayProps;
    selectedIds: string[];
    isSingleImporting: boolean;
    title: string;
    buttons: ButtonProps[];
    onOutsideClick?: () => void;
    onAddGpx: () => void;
    onAddVideoRoute: () => void;
    onSelectFolder: () => void;
    onToggleRoute: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onConfirmSelection: () => void;
    onDone: () => void;
    onTryAgain: () => void;
    onCancel: () => void;
}