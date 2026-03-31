import { ActivityDetailsUI, FormattedNumber } from 'incyclist-services';

export interface ActivitySummaryDialogProps {
    onClose: () => void;   // dismiss -> back to RideMenu (caller's responsibility)
    onExit: () => void;    // navigate away (caller's responsibility)
}

export interface ActivitySummaryDialogViewProps {
    activity: ActivityDetailsUI;
    showMap: boolean;
    showSave: boolean;
    preview?: string;
    units?: Record<string, string>;
    isSaving: boolean;
    isSaved: boolean;
    showDeleteConfirm: boolean;
    onSave: () => void;
    onClose: () => void;
    onDelete: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
    onShareFile: (path: string) => void;
    compact?: boolean;
}

export const isFormattedNumber = (v: unknown): v is FormattedNumber =>
    typeof v === 'object' && v !== null && 'value' in v;