import { DownloadRowDisplayProps } from 'incyclist-services';
import { formatBytes, formatElapsed } from './format';

export type RowTone = 'info' | 'warning' | 'success' | 'error';

export interface ICloudRowText {
    text: string;
    tone: RowTone;
}

const deviceName = (compact: boolean) => (compact ? 'iPhone' : 'iPad');

const joinParts = (parts: Array<string | undefined>) => parts.filter(Boolean).join(' · ');

const downloadingText = (
    row: DownloadRowDisplayProps, compact: boolean, now: number
): ICloudRowText => {
    const size = formatBytes(row.sizeBytes);
    const elapsed = formatElapsed(row.startedAt, now);
    const text = compact
        ? joinParts(['iCloud', size, elapsed])
        : joinParts(['From iCloud', size, elapsed && `started ${elapsed}`]);
    return { text, tone: 'info' };
};

const waitingText = (row: DownloadRowDisplayProps, compact: boolean): ICloudRowText => {
    if (compact)
        return { text: 'Waiting for internet', tone: 'warning' };
    return { text: joinParts(['Waiting for internet', formatBytes(row.sizeBytes)]), tone: 'warning' };
};

const doneText = (row: DownloadRowDisplayProps, compact: boolean): ICloudRowText => {
    if (row.choice === 'this-ride') {
        return {
            text: compact ? 'For this ride only' : 'Downloaded for this ride — removed when you leave it',
            tone: 'success'
        };
    }
    return { text: compact ? 'Downloaded' : `Downloaded to this ${deviceName(compact)}`, tone: 'success' };
};

const notEnoughStorageText = (row: DownloadRowDisplayProps, compact: boolean): ICloudRowText => {
    if (compact)
        return { text: 'Not enough free space', tone: 'warning' };

    const required = formatBytes(row.requiredBytes);
    const free = formatBytes(row.freeBytes);
    const details = [required && `needs ${required}`, free && `${free} free`].filter(Boolean).join(', ');
    return { text: details ? `Not enough free space — ${details}` : 'Not enough free space', tone: 'warning' };
};

// A 'required' row is a stopped download awaiting restart (the availability journal's
// 'cancelled' state). The Downloads screen has no copy of its own for this transient state, so
// it reuses the "stopped" wording route details shows for the same underlying state.
const stoppedText = (): ICloudRowText => ({ text: 'Download stopped', tone: 'info' });

export const getICloudRowText = (
    row: DownloadRowDisplayProps, compact: boolean, now: number = Date.now()
): ICloudRowText => {
    switch (row.status) {
        case 'downloading': return downloadingText(row, compact, now);
        case 'waiting': return waitingText(row, compact);
        case 'done': return doneText(row, compact);
        case 'failed': return { text: 'Download failed', tone: 'error' };
        case 'not-enough-storage': return notEnoughStorageText(row, compact);
        case 'required': return stoppedText();
        default: return { text: '', tone: 'info' };
    }
};
