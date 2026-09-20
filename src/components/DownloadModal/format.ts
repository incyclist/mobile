const BYTES_PER_MB = 1_000_000;
const BYTES_PER_GB = 1_000_000_000;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

/** "4.2 GB" (one decimal) at or above 1 GB, "850 MB" (rounded, no decimal) below it. */
export const formatBytes = (bytes?: number): string | undefined => {
    if (bytes === undefined || Number.isNaN(bytes) || bytes < 0)
        return undefined;

    if (bytes >= BYTES_PER_GB)
        return `${(bytes / BYTES_PER_GB).toFixed(1)} GB`;

    return `${Math.round(bytes / BYTES_PER_MB)} MB`;
};

const formatHoursAndMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;
    return minutes === 0 ? `${hours} h ago` : `${hours} h ${minutes} min ago`;
};

/** "just now" / "6 min ago" / "1 h 20 min ago". */
export const formatElapsed = (startedAt?: number, now: number = Date.now()): string | undefined => {
    if (!startedAt)
        return undefined;

    const minutes = Math.floor(Math.max(0, now - startedAt) / MS_PER_MINUTE);

    if (minutes < 1)
        return 'just now';
    if (minutes < MINUTES_PER_HOUR)
        return `${minutes} min ago`;

    return formatHoursAndMinutes(minutes);
};
