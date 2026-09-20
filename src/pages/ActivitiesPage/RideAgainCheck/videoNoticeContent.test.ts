import type { RouteVideoDisplayProps } from 'incyclist-services';
import { buildAccessOutcomeContent, buildVideoNotice, formatBytes, formatElapsed, getPrimaryAction, isPrimaryActionDisabled } from './videoNoticeContent';

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

describe('formatBytes', () => {
    it('formats sizes under 1 GB in whole MB', () => {
        expect(formatBytes(200 * 1024 * 1024)).toBe('200 MB');
    });

    it('formats sizes at or above 1 GB with one decimal', () => {
        expect(formatBytes(4.2 * 1024 * 1024 * 1024)).toBe('4.2 GB');
    });

    it('returns undefined for missing input', () => {
        expect(formatBytes(undefined)).toBeUndefined();
    });
});

describe('formatElapsed', () => {
    it('reads "just now" for a very recent start', () => {
        expect(formatElapsed(Date.now())).toBe('just now');
    });

    it('reads minutes for a recent-ish start', () => {
        expect(formatElapsed(Date.now() - 6 * 60 * 1000)).toBe('6 min ago');
    });

    it('reads hours and minutes for a longer wait', () => {
        expect(formatElapsed(Date.now() - (60 + 20) * 60 * 1000)).toBe('1 h 20 min ago');
    });

    it('falls back to "just now" without a start time', () => {
        expect(formatElapsed(undefined)).toBe('just now');
    });
});

describe('buildVideoNotice', () => {
    const routeTitle = 'Col de Pennes';
    const device = 'iPad' as const;

    it('describes a not-downloaded video with size and free space', () => {
        const video = videoWith({ state: 'not-downloaded', sizeBytes: 4.2 * 1024 ** 3, freeBytes: 38.5 * 1024 ** 3 });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.tone).toBe('info');
        expect(notice?.headline).toContain('stored in iCloud');
        expect(notice?.body).toContain('4.2 GB');
        expect(notice?.body).toContain('38.5 GB');
    });

    it('offers the "Keep it instead" link while downloading for this ride', () => {
        const video = videoWith({ state: 'downloading', thisRide: true, startedAt: Date.now() });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.showKeepInsteadLink).toBe(true);
    });

    it('does not offer "Keep it instead" while downloading to keep', () => {
        const video = videoWith({ state: 'downloading', thisRide: false, startedAt: Date.now() });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.showKeepInsteadLink).toBeFalsy();
    });

    it('marks not-enough-storage as an error tone', () => {
        const video = videoWith({ state: 'not-enough-storage', requiredBytes: 5 * 1024 ** 3, freeBytes: 1 * 1024 ** 3 });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.tone).toBe('error');
    });

    it('shows the transient copy for a signed-out iCloud, without a folder path', () => {
        const video = videoWith({ state: 'access-lost', transient: true });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.headline).toContain("isn't available");
    });

    it('shows the confirm-access copy with the target folder for a non-transient access loss', () => {
        const video: RouteVideoDisplayProps = {
            ...videoWith({ state: 'access-lost', transient: false }, { confirmAccess: true }),
            access: { target: { folder: '/x', displayPath: 'iCloud Drive › Videos', location: 'icloud', siblingCount: 3 } },
        };
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.headline).toContain('needs your OK');
        expect(notice?.body).toContain('iCloud Drive › Videos');
    });

    it('shows the ready-for-this-ride notice with the keep link even without downloadedWhileOpen', () => {
        const video = videoWith({ state: 'ready', thisRide: true, choice: 'this-ride' });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice?.headline).toBe('Downloaded for this ride');
        expect(notice?.showKeepInsteadLink).toBe(true);
    });

    it('shows the "Video downloaded" notice once a ready-and-kept video finished while the panel was open', () => {
        const video = videoWith({ state: 'ready' });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: true });
        expect(notice?.headline).toBe('Video downloaded');
    });

    it('shows nothing for a ready video that was already ready before the panel opened', () => {
        const video = videoWith({ state: 'ready' });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice).toBeUndefined();
    });

    it('shows nothing for the unknown state', () => {
        const video = videoWith({ state: 'unknown' });
        const notice = buildVideoNotice({ video, routeTitle, device, downloadedWhileOpen: false });
        expect(notice).toBeUndefined();
    });
});

describe('buildAccessOutcomeContent', () => {
    it('describes a confirmed outcome', () => {
        expect(buildAccessOutcomeContent('confirmed')?.headline).toBe('Access confirmed');
    });

    it('describes a wrong-folder outcome', () => {
        expect(buildAccessOutcomeContent('wrong-folder')?.tone).toBe('warning');
    });

    it('shows nothing for a cancelled picker', () => {
        expect(buildAccessOutcomeContent('cancelled')).toBeUndefined();
    });
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
