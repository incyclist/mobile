import type { RouteVideoDisplayProps } from 'incyclist-services';
import { getPrimaryAction, isPrimaryActionDisabled } from './primaryAction';

const baseActions = {
    download: false, downloadEnabled: false, stop: false, retry: false,
    keepInstead: false, remove: false, confirmAccess: false,
};

const videoWith = (overrides: Partial<RouteVideoDisplayProps['status']>, actions?: Partial<RouteVideoDisplayProps['actions']>): RouteVideoDisplayProps => ({
    status: {
        routeId: 'r1',
        state: 'not-downloaded',
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: false,
        ...overrides,
    },
    canStart: overrides.state === 'ready' || overrides.state === 'unknown',
    actions: { ...baseActions, ...actions },
});

describe('getPrimaryAction', () => {
    it('picks download when offered', () => {
        const video = videoWith({ state: 'not-downloaded' }, { download: true });
        expect(getPrimaryAction(video)).toBe('download');
    });

    it('picks stop while downloading', () => {
        const video = videoWith({ state: 'downloading' }, { stop: true });
        expect(getPrimaryAction(video)).toBe('stop');
    });

    it('picks retry after a failure', () => {
        const video = videoWith({ state: 'download-failed' }, { retry: true });
        expect(getPrimaryAction(video)).toBe('retry');
    });

    it('picks confirmAccess when access is lost and not transient', () => {
        const video = videoWith({ state: 'access-lost', transient: false }, { confirmAccess: true });
        expect(getPrimaryAction(video)).toBe('confirmAccess');
    });

    it('picks rideAgain once the video is ready', () => {
        const video = videoWith({ state: 'ready' });
        expect(getPrimaryAction(video)).toBe('rideAgain');
    });

    it('picks none when nothing is actionable (e.g. not-found)', () => {
        const video = videoWith({ state: 'not-found' });
        expect(getPrimaryAction(video)).toBe('none');
    });
});

describe('isPrimaryActionDisabled', () => {
    it('is true for not-enough-storage (download offered but disabled)', () => {
        const video = videoWith({ state: 'not-enough-storage' }, { download: true, downloadEnabled: false });
        expect(isPrimaryActionDisabled(video)).toBe(true);
    });

    it('is false for a normal not-downloaded video', () => {
        const video = videoWith({ state: 'not-downloaded' }, { download: true, downloadEnabled: true });
        expect(isPrimaryActionDisabled(video)).toBe(false);
    });

    it('is false for actions other than download (e.g. stop)', () => {
        const video = videoWith({ state: 'downloading' }, { stop: true });
        expect(isPrimaryActionDisabled(video)).toBe(false);
    });
});
