import { SelectedActivityDisplayProperties } from 'incyclist-services';

export interface ActivityDetailsDialogViewProps extends SelectedActivityDisplayProperties {
    loading?: boolean;
    onClose: () => void;
    onRideAgain: () => void;
    onShareFile: (path: string) => void;
    onUpload: (type: string) => void;
    onOpenUpload: (url: string) => void;
    compact?: boolean;
}

export interface ActivityDetailsDialogProps {
    onClose: () => void;
    onRideAgain: (route: any) => void;
}

export const isFormattedNumber = (v: unknown): v is { value: number; unit: string } =>
    typeof v === 'object' && v !== null && 'value' in v;