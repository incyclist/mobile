import { RouteImportDisplayProperties } from 'incyclist-services';

export interface RouteImportDialogProps {
    onClose: () => void;
}

export interface RouteImportDialogViewProps {
    compact?: boolean;
    title: string;
    buttons: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }[];
    onOutsideClick?: () => void;
    displayProps: RouteImportDisplayProperties;
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

export interface LandingViewProps {
    onAddGpx: () => void;
    onAddVideoRoute: () => void;
    onSelectFolder: () => void;
}

export interface ScanningViewProps {
    statusText: string;
}

export interface ParseSelectionViewProps {
    displayProps: RouteImportDisplayProperties;
    selectedIds: string[];
    onToggleRoute: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export interface IngestingViewProps {
    progress: number;
    statusText: string;
}

export interface CompleteViewProps {
    count: number;
}

export interface ResultViewProps {
    success: boolean;
    message: string;
    errorDetails?: string;
}