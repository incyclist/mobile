import { useCallback, useEffect, useState } from 'react';
import { useRouteCopy, useRouteSharingClient } from 'incyclist-services';
import type { RouteCopyState } from 'incyclist-services';
import { useLogging } from '../../hooks';

/** The size of the video as the computers report it (the largest, if they disagree); undefined if unknown. */
const getShareSize = (client: ReturnType<typeof useRouteSharingClient>, routeId: string): number | undefined => {
    try {
        const sizes = client.getRowsForRoute(routeId).map(r => r.size).filter(s => s > 0);
        return sizes.length > 0 ? Math.max(...sizes) : undefined;
    }
    catch {
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
    const [sizeBytes] = useState(() => (enabled ? getShareSize(sharing, routeId) : undefined));

    // Not gated on `enabled`: once the copy has finished the route is no longer copyable, but the
    // final state change still has to arrive.
    useEffect(() => {
        const onChange = (ev: { routeKey: string, state: RouteCopyState }) => {
            if (ev.routeKey === routeId)
                setState(ev.state);
        };
        setState(service.getState(routeId));
        service.on('state-changed', onChange);
        return () => { service.off('state-changed', onChange); };
    }, [service, routeId]);

    const copy = useCallback(() => {
        service.copyToDevice(routeId).catch((err: Error) => logError(err, 'copyToDevice'));
    }, [service, routeId, logError]);
    const cancel = useCallback(() => { service.cancel(routeId); }, [service, routeId]);
    const clear = useCallback(() => { service.clear(routeId); }, [service, routeId]);

    return { state, sizeBytes, copy, cancel, clear };
};
