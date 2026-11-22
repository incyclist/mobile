import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useRouteThumbnailCache } from 'incyclist-services';
import { useCachedThumbnail } from './useCachedThumbnail';

jest.mock('incyclist-services', () => ({
    useRouteThumbnailCache: jest.fn(),
}));

const URL = 'https://cdn/t.jpg';

describe('useCachedThumbnail', () => {
    let cache: { getCached: jest.Mock; cache: jest.Mock; invalidate: jest.Mock };

    beforeEach(() => {
        cache = {
            getCached: jest.fn().mockResolvedValue(undefined),
            cache: jest.fn().mockResolvedValue('file:///app/thumbnails/x.img'),
            invalidate: jest.fn().mockResolvedValue(undefined),
        };
        (useRouteThumbnailCache as jest.Mock).mockReturnValue(cache);
    });

    it('is ready at once and does not touch the cache without a route key', () => {
        const { result } = renderHook(() => useCachedThumbnail(undefined, URL));
        expect(result.current.ready).toBe(true);
        expect(result.current.cachedUri).toBeUndefined();
        expect(cache.getCached).not.toHaveBeenCalled();
    });

    it('is ready at once for a source that is not http(s)', () => {
        const { result } = renderHook(() => useCachedThumbnail('r1', 'file:///a.jpg'));
        expect(result.current.ready).toBe(true);
        expect(cache.getCached).not.toHaveBeenCalled();
    });

    it('returns the cached file and does not fetch', async () => {
        cache.getCached.mockResolvedValue('file:///app/thumbnails/x.img');
        const { result } = renderHook(() => useCachedThumbnail('r1', URL));
        expect(result.current.ready).toBe(false);
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.cachedUri).toBe('file:///app/thumbnails/x.img');
        expect(cache.cache).not.toHaveBeenCalled();
    });

    it('falls back to the original and fetches in the background on a miss', async () => {
        const { result } = renderHook(() => useCachedThumbnail('r1', URL));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.cachedUri).toBeUndefined();
        expect(cache.cache).toHaveBeenCalledWith({ routeKey: 'r1', url: URL });
    });

    it('a failing cache never breaks rendering', async () => {
        cache.getCached.mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useCachedThumbnail('r1', URL));
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.cachedUri).toBeUndefined();
    });

    it('a cached file that cannot be displayed is dropped and invalidated', async () => {
        cache.getCached.mockResolvedValue('file:///app/thumbnails/x.img');
        const { result } = renderHook(() => useCachedThumbnail('r1', URL));
        await waitFor(() => expect(result.current.cachedUri).toBeDefined());
        act(() => result.current.onCacheError());
        expect(result.current.cachedUri).toBeUndefined();
        expect(cache.invalidate).toHaveBeenCalledWith({ routeKey: 'r1', url: URL });
    });

    describe('thumbnail of a computer', () => {
        const link = { linkId: 'l1', thumbHandle: 't1' };

        it('is shown from the device when it is cached there', async () => {
            cache.getCached.mockResolvedValue('file:///app/thumbnails/x.img');
            const { result } = renderHook(() => useCachedThumbnail('r1', undefined, link));
            await waitFor(() => expect(result.current.ready).toBe(true));
            expect(result.current.cachedUri).toBe('file:///app/thumbnails/x.img');
            expect(cache.getCached).toHaveBeenCalledWith({ routeKey: 'r1', url: undefined, link });
            expect(cache.cache).not.toHaveBeenCalled();
        });

        it('is fetched and shown as soon as the computer has delivered it, as there is no original', async () => {
            const { result } = renderHook(() => useCachedThumbnail('r1', undefined, link));
            await waitFor(() => expect(result.current.cachedUri).toBe('file:///app/thumbnails/x.img'));
            expect(cache.cache).toHaveBeenCalledWith({ routeKey: 'r1', url: undefined, link });
        });

        it('stays without a thumbnail when the computer does not deliver', async () => {
            cache.cache.mockResolvedValue(undefined);
            const { result } = renderHook(() => useCachedThumbnail('r1', undefined, link));
            await waitFor(() => expect(cache.cache).toHaveBeenCalled());
            expect(result.current.ready).toBe(true);
            expect(result.current.cachedUri).toBeUndefined();
        });

        it('is not looked up without a route key or a handle', () => {
            renderHook(() => useCachedThumbnail(undefined, undefined, link));
            renderHook(() => useCachedThumbnail('r1', undefined, { linkId: 'l1', thumbHandle: '' }));
            expect(cache.getCached).not.toHaveBeenCalled();
        });
    });
});
