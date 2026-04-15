export type DownloadStatus = 'downloading' | 'done' | 'failed' | 'required';

export interface DownloadRowDisplayProps {
    routeId: string;
    title: string;
    status: DownloadStatus;
    pct?: number;         // 0–100, present when status === 'downloading'
    speed?: string;       // e.g. '2.1 MB/s', present when downloading
    sizeLabel?: string;   // e.g. '3.1 / 5.0 GB', present when downloading
}

export interface DownloadModalViewProps {
    visible: boolean;
    rows: DownloadRowDisplayProps[];
    onStop: (routeId: string) => void;
    onRetry: (routeId: string) => void;
    onDelete: (routeId: string) => void;
    onClose: () => void;
}

export interface DownloadModalProps {
    visible: boolean;
    onClose: () => void;
}