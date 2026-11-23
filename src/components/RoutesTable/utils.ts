import type { RouteItemProps } from 'incyclist-services';

/**
 * The rows only need to be rendered again if the list has other routes, or if one of them changed
 * where it plays from. Anything else on a row reaches it through its own observer, so an unchanged
 * route (the page service keeps its identity) costs nothing here.
 */
export const areRoutesEqual = (prev?: Array<RouteItemProps>, next?: Array<RouteItemProps>): boolean => {
    if (prev === next)
        return true;
    if (prev?.length !== next?.length)
        return false;
    for (let i = 0; i < (prev?.length ?? 0); i++) {
        const p = prev![i];
        const n = next![i];
        if (p === n)
            continue;
        if (p.id !== n.id || p.availability !== n.availability || p.sourceLabel !== n.sourceLabel
            || p.unavailableReason !== n.unavailableReason || p.thumbnailLink?.thumbHandle !== n.thumbnailLink?.thumbHandle
            || p.thumbnailLink?.linkId !== n.thumbnailLink?.linkId)
            return false;
    }
    return true;
};
