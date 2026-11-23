import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouteThumbnailCache } from 'incyclist-services';
import type { ThumbnailLinkSource, ThumbnailRequest } from 'incyclist-services';
import { useLogging } from '../logging';

export interface CachedThumbnail {
    /** `file://` URI of the cached thumbnail, once there is one */
    cachedUri?: string;
    /** false while the local lookup is still running; true immediately if the request is not cacheable */
    ready: boolean;
    /** true once there is no thumbnail to show and none to come (link-only thumbnail that could not be fetched or displayed) */
    failed: boolean;
    /** call when the cached file could not be displayed: drops it, so the caller falls back to the original source */
    onCacheError: () => void;
}

// Outcome counts are logged in aggregate (a list mounts many rows at once), never per row.
const OUTCOME_LOG_DELAY_MS = 5000;
const outcomes = { ready: 0, failed: 0 };
let outcomeTimer: ReturnType<typeof setTimeout> | undefined;

const countOutcome = (kind: 'ready' | 'failed', logEvent?: (event: Record<string, unknown>) => void) => {
    try {
        outcomes[kind]++;
        if (outcomeTimer) {
            return;
        }
        outcomeTimer = setTimeout(() => {
            outcomeTimer = undefined;
            const { ready, failed } = outcomes;
            outcomes.ready = 0;
            outcomes.failed = 0;
            try {
                logEvent?.({ message: 'computer thumbnails', ready, failed });
            } catch {
                // logging must never break rendering
            }
        }, OUTCOME_LOG_DELAY_MS);
        (outcomeTimer as { unref?: () => void }).unref?.();
    } catch {
        // counting is best effort
    }
};

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
    const { logError, logEvent: logEventFn } = useLogging('useCachedThumbnail');
    const logEventRef = useRef(logEventFn);
    logEventRef.current = logEventFn;
    const logEvent = useCallback((event: Record<string, unknown>) => logEventRef.current?.(event), []);
    const [state, setState] = useState<{ id?: string; cachedUri?: string; failed?: boolean }>({});
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

        const lookup = async (): Promise<string | undefined> => {
            try {
                const cache = useRouteThumbnailCache();
                const cachedUri = await cache.getCached(request);
                if (!cachedUri && !linkOnly) {
                    // not shown now (the original is), stored for the next time
                    cache.cache(request).catch((err: any) => logError(err, 'useCachedThumbnail.cache'));
                }
                return cachedUri;
            } catch (err: any) {
                logError(err, 'useCachedThumbnail.lookup');
                return undefined;
            }
        };

        const fetchForLinkOnly = async () => {
            try {
                // there is no original to show: the thumbnail appears as soon as the computer has delivered it
                const fetched = await useRouteThumbnailCache().cache(request);
                if (cancelled) {
                    return;
                }
                if (fetched) {
                    setState({ id, cachedUri: fetched });
                    countOutcome('ready', logEvent);
                } else {
                    setState({ id, failed: true });
                    countOutcome('failed', logEvent);
                }
            } catch (err: any) {
                // the caller shows its fallback
                logError(err, 'useCachedThumbnail.fetch');
                if (!cancelled) {
                    setState({ id, failed: true });
                    countOutcome('failed', logEvent);
                }
            }
        };

        const run = async () => {
            try {
                const cachedUri = await lookup();
                if (!cancelled) {
                    setState({ id, cachedUri });
                }
                if (cachedUri && linkOnly) {
                    countOutcome('ready', logEvent);
                }
                if (!cachedUri && linkOnly) {
                    await fetchForLinkOnly();
                }
            } catch (err: any) {
                logError(err, 'useCachedThumbnail.run');
            }
        };
        run().catch((err: any) => logError(err, 'useCachedThumbnail.run'));

        return () => {
            cancelled = true;
        };
    }, [id, routeKey, url, hasUrl, linkOnly, linkId, thumbHandle, logError, logEvent]);

    const onCacheError = useCallback(() => {
        const request = requestRef.current;
        setState(prev => ({ ...prev, cachedUri: undefined, failed: linkOnly ? true : prev.failed }));
        if (isCacheable(request)) {
            try {
                useRouteThumbnailCache().invalidate(request).catch((err: any) => logError(err, 'useCachedThumbnail.invalidate'));
            } catch (err: any) {
                // nothing to clean up
                logError(err, 'useCachedThumbnail.onCacheError');
            }
        }
    }, [logError, linkOnly]);

    if (!id) {
        return { ready: true, failed: false, onCacheError };
    }
    const current = state.id === id;
    return { ready: current, cachedUri: current ? state.cachedUri : undefined, failed: current && !!state.failed, onCacheError };
};
