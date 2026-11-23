import { useCallback, useEffect, useState } from 'react';
import { useRouteCopy, useRouteSharingClient } from 'incyclist-services';
import type { RouteCopyState } from 'incyclist-services';
import { useLogging } from '../../hooks';

/** The size of the video as the computers report it (the largest, if they disagree); undefined if unknown. */
const getShareSize = (
    client: ReturnType<typeof useRouteSharingClient>,
    routeId: string,
    logError: (err: any, fn: string) => void,
): number | undefined => {
    try {
        const sizes = client.getRowsForRoute(routeId).map(r => r.size).filter(s => s > 0);
        return sizes.length > 0 ? Math.max(...sizes) : undefined;
    }
    catch (err: any) {
        logError(err, 'getShareSize');
        return undefined;
    }
};

/**
 * Follows the copy of one route's video from a computer to this device and offers the actions on it.
 * Everything - the free-space check, progress, cancel - is decided by the copy service.
 */
export const useRouteCopyState = (routeId: string, enabled: boolean) => {
    const { logError } = useLogging('RouteCopy');
    const service = useRouteCopy();
    const sharing = useRouteSharingClient();
    const [state, setState] = useState<RouteCopyState>(() => service.getState(routeId));
    const [sizeBytes] = useState(() => (enabled ? getShareSize(sharing, routeId, logError) : undefined));

    // Not gated on `enabled`: once the copy has finished the route is no longer copyable, but the
    // final state change still has to arrive.
    useEffect(() => {
        const onChange = (ev: { routeKey: string, state: RouteCopyState }) => {
            try {
                if (ev.routeKey === routeId)
                    setState(ev.state);
            }
            catch (err: any) {
                logError(err, 'useRouteCopyState.onChange');
            }
        };
        try {
            setState(service.getState(routeId));
            service.on('state-changed', onChange);
        }
        catch (err: any) {
            logError(err, 'useRouteCopyState.subscribe');
        }
        return () => {
            try {
                service.off('state-changed', onChange);
            }
            catch (err: any) {
                logError(err, 'useRouteCopyState.unsubscribe');
            }
        };
    }, [service, routeId, logError]);

    const copy = useCallback(() => {
        try {
            service.copyToDevice(routeId).catch((err: Error) => logError(err, 'copyToDevice'));
        }
        catch (err: any) {
            logError(err, 'copyToDevice');
        }
    }, [service, routeId, logError]);
    const cancel = useCallback(() => {
        try {
            service.cancel(routeId);
        }
        catch (err: any) {
            logError(err, 'cancel');
        }
    }, [service, routeId, logError]);
    const clear = useCallback(() => {
        try {
            service.clear(routeId);
        }
        catch (err: any) {
            logError(err, 'clear');
        }
    }, [service, routeId, logError]);

    return { state, sizeBytes, copy, cancel, clear };
};
