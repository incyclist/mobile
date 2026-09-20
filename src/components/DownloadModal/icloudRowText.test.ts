import { getICloudRowText } from './icloudRowText';
import { DownloadRowDisplayProps } from 'incyclist-services';

const now = 1_000_000_000;

const row = (overrides: Partial<DownloadRowDisplayProps>): DownloadRowDisplayProps => ({
    routeId: 'r1',
    title: 'Col de Pennes',
    status: 'downloading',
    source: 'icloud',
    ...overrides,
});

describe('getICloudRowText', () => {
    it('downloading, tablet: full sentence with size and elapsed', () => {
        const result = getICloudRowText(
            row({ status: 'downloading', sizeBytes: 4_200_000_000, startedAt: now - 6 * 60_000 }),
            false,
            now
        );
        expect(result).toEqual({ text: 'From iCloud · 4.2 GB · started 6 min ago', tone: 'info' });
    });

    it('downloading, phone: shortened sentence', () => {
        const result = getICloudRowText(
            row({ status: 'downloading', sizeBytes: 4_200_000_000, startedAt: now - 6 * 60_000 }),
            true,
            now
        );
        expect(result).toEqual({ text: 'iCloud · 4.2 GB · 6 min ago', tone: 'info' });
    });

    it('waiting, tablet: includes size', () => {
        const result = getICloudRowText(row({ status: 'waiting', sizeBytes: 2_900_000_000 }), false);
        expect(result).toEqual({ text: 'Waiting for internet · 2.9 GB', tone: 'warning' });
    });

    it('waiting, phone: no size', () => {
        const result = getICloudRowText(row({ status: 'waiting', sizeBytes: 2_900_000_000 }), true);
        expect(result).toEqual({ text: 'Waiting for internet', tone: 'warning' });
    });

    it('done, kept, tablet: names the device', () => {
        const result = getICloudRowText(row({ status: 'done' }), false);
        expect(result).toEqual({ text: 'Downloaded to this iPad', tone: 'success' });
    });

    it('done, kept, phone: names the device', () => {
        const result = getICloudRowText(row({ status: 'done' }), true);
        expect(result).toEqual({ text: 'Downloaded', tone: 'success' });
    });

    it('done, for this ride, tablet', () => {
        const result = getICloudRowText(row({ status: 'done', choice: 'this-ride' }), false);
        expect(result).toEqual({ text: 'Downloaded for this ride — removed when you leave it', tone: 'success' });
    });

    it('done, for this ride, phone', () => {
        const result = getICloudRowText(row({ status: 'done', choice: 'this-ride' }), true);
        expect(result).toEqual({ text: 'For this ride only', tone: 'success' });
    });

    it('failed: same text both layouts', () => {
        expect(getICloudRowText(row({ status: 'failed' }), false)).toEqual({ text: 'Download failed', tone: 'error' });
        expect(getICloudRowText(row({ status: 'failed' }), true)).toEqual({ text: 'Download failed', tone: 'error' });
    });

    it('not enough storage, tablet: includes required and free', () => {
        const result = getICloudRowText(
            row({ status: 'not-enough-storage', requiredBytes: 4_700_000_000, freeBytes: 1_300_000_000 }),
            false
        );
        expect(result).toEqual({ text: 'Not enough free space — needs 4.7 GB, 1.3 GB free', tone: 'warning' });
    });

    it('not enough storage, phone: no detail', () => {
        const result = getICloudRowText(
            row({ status: 'not-enough-storage', requiredBytes: 4_700_000_000, freeBytes: 1_300_000_000 }),
            true
        );
        expect(result).toEqual({ text: 'Not enough free space', tone: 'warning' });
    });

    it('required (stopped, pending restart)', () => {
        expect(getICloudRowText(row({ status: 'required' }), false)).toEqual({ text: 'Download stopped', tone: 'info' });
    });
});
