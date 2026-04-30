import { ImportDisplayProps } from 'incyclist-services';

export interface ImportRoutesDialogProps {
    visible: boolean;
    onClose: () => void;
}

export interface ImportRoutesDialogViewProps {
    compact: boolean;
    displayProps: ImportDisplayProps;
    selectedIds: string[];
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