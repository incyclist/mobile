import { DownloadRowDisplayProps } from 'incyclist-services';

export interface DownloadModalViewProps {
    visible: boolean;
    rows: DownloadRowDisplayProps[];
    nested?:boolean,
    /** Phone (compact) layout uses the shorter iCloud row texts; tablet (full) is the default. */
    compact?: boolean;
    onStop: (routeId: string) => void;
    onRetry: (routeId: string) => void;
    onDelete: (routeId: string) => void;
    /** Optional so existing call sites that predate iCloud rows don't have to pass it - those
     *  never render an iCloud "done, for this ride" row, so it would never be invoked anyway. */
    onKeepInstead?: (routeId: string) => void;
    onClose: () => void;
}