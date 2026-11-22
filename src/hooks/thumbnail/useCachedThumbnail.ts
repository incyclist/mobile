import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouteThumbnailCache } from 'incyclist-services';
import type { ThumbnailLinkSource, ThumbnailRequest } from 'incyclist-services';

export interface CachedThumbnail {
    /** `file://` URI of the cached thumbnail, once there is one */
    cachedUri?: string;
    /** false while the local lookup is still running; true immediately if the request is not cacheable */
    ready: boolean;
    /** call when the cached file could not be displayed: drops it, so the caller falls back to the original source */
    onCacheError: () => void;
}

const isCacheable = (request?: ThumbnailRequest): request is ThumbnailRequest =>
    !!request && (/^https?:\/\//i.test(request.url ?? '') || !!request.link);

/**
 * Cache-first access to a route thumbnail. Looks the thumbnail up on the device; if it is not
 * there yet it is fetched and stored in the background for next time (the caller keeps showing the
 * original source meanwhile). Every failure is swallowed: the caller just keeps using the original.
 */
export const useCachedThumbnail = (routeKey: string | undefined, url: string | undefined, link?: ThumbnailLinkSource): CachedThumbnail => {
    const hasUrl = /^https?:\/\//i.test(url ?? '');
    const linkOnly = !hasUrl && !!link?.linkId && !!link?.thumbHandle;
    const enabled = !!routeKey && (hasUrl || linkOnly);
    const [state, setState] = useState<{ id?: string; cachedUri?: string }>({});
    const requestRef = useRef<ThumbnailRequest | undefined>(undefined);
    const linkId = link?.linkId;
    const thumbHandle = link?.thumbHandle;
    const id = enabled ? `${routeKey}|${url}|${linkId}` : undefined;

    useEffect(() => {
        if (!id) {
            return;
        }
        const request: ThumbnailRequest = { routeKey, url: hasUrl ? url : undefined };
        if (linkId && thumbHandle) {
            request.link = { linkId, thumbHandle };
        }
        requestRef.current = request;
        let cancelled = false;

        const run = async () => {
            let cachedUri: string | undefined;
            try {
                const cache = useRouteThumbnailCache();
                cachedUri = await cache.getCached(request);
                if (!cachedUri && !linkOnly) {
                    // not shown now (the original is), stored for the next time
                    cache.cache(request).catch(() => undefined);
                }
            } catch {
                cachedUri = undefined;
            }
            if (!cancelled) {
                setState({ id, cachedUri });
            }
            if (!cachedUri && linkOnly) {
                // there is no original to show: the thumbnail appears as soon as the computer has delivered it
                try {
                    const fetched = await useRouteThumbnailCache().cache(request);
                    if (!cancelled && fetched) {
                        setState({ id, cachedUri: fetched });
                    }
                } catch {
                    // the row keeps looking as it does
                }
            }
        };
        run();

        return () => {
            cancelled = true;
        };
    }, [id, routeKey, url, hasUrl, linkOnly, linkId, thumbHandle]);

    const onCacheError = useCallback(() => {
        const request = requestRef.current;
        setState(prev => ({ ...prev, cachedUri: undefined }));
        if (isCacheable(request)) {
            try {
                useRouteThumbnailCache().invalidate(request).catch(() => undefined);
            } catch {
                // nothing to clean up
            }
        }
    }, []);

    if (!id) {
        return { ready: true, onCacheError };
    }
    return { ready: state.id === id, cachedUri: state.id === id ? state.cachedUri : undefined, onCacheError };
};
