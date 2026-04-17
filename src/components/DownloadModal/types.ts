import { DownloadRowDisplayProps } from 'incyclist-services';

export interface DownloadModalViewProps {
    visible: boolean;
    rows: DownloadRowDisplayProps[];
    nested?:boolean,
    onStop: (routeId: string) => void;
    onRetry: (routeId: string) => void;
    onDelete: (routeId: string) => void;
    onClose: () => void;
}