import { SelectedActivityDisplayProperties } from 'incyclist-services';

export interface ActivityDetailsDialogViewProps extends SelectedActivityDisplayProperties {
    loading?: boolean;
    ftp?: number;
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