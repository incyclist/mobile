import { getServersSummary, getSharingSummary } from './utils';

const server = (over: Record<string, unknown>) => ({
    key: 'a', name: 'a', isBuiltIn: false, status: 'ok', statusText: '', canRemove: true, ...over,
}) as any;

describe('getServersSummary', () => {
    it('does not count the built-in server', () => {
        const res = getServersSummary([server({ isBuiltIn: true })]);
        expect(res).toEqual({ text: 'No servers added' });
    });

    it('sums the routes of the added servers', () => {
        const res = getServersSummary([
            server({ isBuiltIn: true, routeCount: 500 }),
            server({ key: 'a', routeCount: 24 }),
            server({ key: 'b', routeCount: 12 }),
        ]);
        expect(res).toEqual({ text: '2 servers · 36 routes' });
    });

    it('uses singular forms', () => {
        expect(getServersSummary([server({ routeCount: 1 })]).text).toBe('1 server · 1 route');
    });

    it('warns about servers that could not be reached', () => {
        const res = getServersSummary([server({ routeCount: 3 }), server({ key: 'b', status: 'unreachable' })]);
        expect(res).toEqual({ text: "1 server couldn't be reached", warning: true });
    });
});

describe('getSharingSummary', () => {
    const link = (over: Record<string, unknown> = {}) => ({ linkId: 'l1', displayName: 'Home PC', reachability: 'reachable', ...over }) as any;

    it('says "Not set up" without a computer', () => {
        expect(getSharingSummary([], () => 0)).toEqual({ text: 'Not set up' });
    });

    it('names a single reachable computer and its routes', () => {
        expect(getSharingSummary([link()], () => 128)).toEqual({ text: 'Home PC connected · 128 routes' });
    });

    it('warns if the single computer is not reachable', () => {
        const res = getSharingSummary([link({ reachability: 'not-reachable' })], () => 128);
        expect(res).toEqual({ text: 'Home PC not connected', warning: true });
    });

    it('does not warn while the computer is being checked', () => {
        const res = getSharingSummary([link({ reachability: 'checking' })], () => 5);
        expect(res.warning).toBe(false);
    });

    it('summarizes several computers', () => {
        const res = getSharingSummary([link(), link({ linkId: 'l2' })], id => (id === 'l1' ? 10 : 5));
        expect(res).toEqual({ text: '2 computers · 15 routes' });
    });
});
