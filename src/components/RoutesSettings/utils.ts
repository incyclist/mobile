import { useLocalLinkClient, useAppState } from 'incyclist-services';
import type { LinkClientLink, RouteServerItem } from 'incyclist-services';
import type { RoutesCardSummary } from './types';

const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
    `${count} ${count === 1 ? singular : pluralForm}`;

/** "2 servers · 36 routes", or an amber note if servers could not be reached. The built-in server is not counted. */
export const getServersSummary = (servers: RouteServerItem[]): RoutesCardSummary => {
    const userServers = servers.filter(s => !s.isBuiltIn);
    if (userServers.length === 0) {
        return { text: 'No servers added' };
    }

    const unreachable = userServers.filter(s => s.status === 'unreachable').length;
    if (unreachable > 0) {
        return { text: `${plural(unreachable, 'server')} couldn't be reached`, warning: true };
    }

    const routes = userServers.reduce((sum, s) => sum + (s.routeCount ?? 0), 0);
    return { text: `${plural(userServers.length, 'server')} · ${plural(routes, 'route')}` };
};

/** "Home PC connected · 128 routes", or "Not set up" while no computer is paired. */
export const getSharingSummary = (
    links: Pick<LinkClientLink, 'linkId' | 'displayName' | 'reachability'>[],
    countRoutes: (linkId: string) => number
): RoutesCardSummary => {
    if (links.length === 0) {
        return { text: 'Not set up' };
    }

    const routes = links.reduce((sum, l) => sum + countRoutes(l.linkId), 0);
    if (links.length > 1) {
        return { text: `${plural(links.length, 'computer')} · ${plural(routes, 'route')}` };
    }

    const [link] = links;
    if (link.reachability === 'reachable') {
        return { text: `${link.displayName} connected · ${plural(routes, 'route')}` };
    }
    return { text: `${link.displayName} not connected`, warning: link.reachability !== 'checking' };
};

/**
 * Route Sharing is offered only with the BRIDGE_MODE toggle on and an app that supports it.
 * Evaluated once per render of the caller, never throws.
 */
export const useRouteSharingAvailable = (): boolean => {
    try {
        return useAppState().hasFeature('BRIDGE_MODE') === true && useLocalLinkClient().getDisplayProps().available === true;
    } catch {
        return false;
    }
};
