import { getCopyButtonLabel, getCopyFailureText, getCopyRow } from './routeCopy';

describe('getCopyFailureText', () => {
    it('words the refusal for a video that does not fit', () => {
        expect(getCopyFailureText({ status: 'failed', reason: 'no-space', sizeBytes: 4_200_000_000, freeBytes: 1_100_000_000 }))
            .toBe('Not enough space on this device. This route needs 4.2 GB; 1.1 GB is free.');
    });

    it('drops the numbers it does not have', () => {
        expect(getCopyFailureText({ status: 'failed', reason: 'no-space' })).toBe('Not enough space on this device.');
    });

    it('says nothing for a cancel, a running copy or no copy', () => {
        expect(getCopyFailureText({ status: 'failed', reason: 'cancelled' })).toBeUndefined();
        expect(getCopyFailureText({ status: 'copying', progress: 3 })).toBeUndefined();
        expect(getCopyFailureText({ status: 'idle' })).toBeUndefined();
    });

    it.each(['unreachable', 'gone', 'details'] as const)('has its own text for %s', (reason) => {
        expect(getCopyFailureText({ status: 'failed', reason })).toBeTruthy();
    });

    it.each(['unknown', 'not-supported', 'unknown-route'] as const)('falls back to a plain failure for %s', (reason) => {
        expect(getCopyFailureText({ status: 'failed', reason })).toBe('Download failed');
    });
});

describe('getCopyRow / getCopyButtonLabel', () => {
    it('shows progress while copying', () => {
        expect(getCopyRow('r1', 'T', { status: 'copying', progress: 42 })).toEqual({ routeId: 'r1', title: 'T', status: 'downloading', pct: 42 });
        expect(getCopyButtonLabel({ status: 'copying', progress: 42 })).toBe('Downloading…');
    });

    it('offers a retry after a failure, but not after a cancel', () => {
        expect(getCopyRow('r1', 'T', { status: 'failed', reason: 'unreachable' })?.status).toBe('failed');
        expect(getCopyButtonLabel({ status: 'failed', reason: 'unreachable' })).toBe('Retry Download');
        expect(getCopyRow('r1', 'T', { status: 'failed', reason: 'cancelled' })).toBeNull();
        expect(getCopyButtonLabel({ status: 'failed', reason: 'cancelled' })).toBe('Download');
    });

    it('has no row and a plain button while idle', () => {
        expect(getCopyRow('r1', 'T', { status: 'idle' })).toBeNull();
        expect(getCopyButtonLabel({ status: 'idle' })).toBe('Download');
    });
});
