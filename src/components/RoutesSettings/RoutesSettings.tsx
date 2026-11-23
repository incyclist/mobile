import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalLinkClient, useRouteServersSettingsDisplay, useRouteSharingClient } from 'incyclist-services';
import type { LocalLinkClientDisplayProps } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { RouteServersDialog } from '../RouteServersDialog';
import { RouteSharingSettings } from '../RouteSharingSettings';
import { RoutesSettingsView } from './RoutesSettingsView';
import { getServersSummary, getSharingSummary, useRouteSharingAvailable } from './utils';
import type { RoutesCard, RoutesCardKey, RoutesSettingsProps } from './types';

type Screen = 'section' | RoutesCardKey;

const SERVERS_DESCRIPTION = 'Collections hosted by other riders and groups';
const SHARING_DESCRIPTION = 'Ride the videos stored on your computer, over your Wi-Fi.';

const RoutesSection = ({ onClose }: RoutesSettingsProps) => {
    const client = useLocalLinkClient();
    const sharing = useRouteSharingClient();
    const servers = useRouteServersSettingsDisplay();
    const { logEvent } = useLogging('RoutesSettings');
    const [screen, setScreen] = useState<Screen>('section');
    const [sharingProps, setSharingProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => setSharingProps(props);
        client.on('state-changed', onChange);
        setSharingProps(client.getDisplayProps());
        logEvent({ message: 'dialog shown', dialog: 'RoutesSettings' });
        return () => {
            client.off('state-changed', onChange);
        };
    }, [client, logEvent]);

    // read again whenever the rider comes back from one of the screens: servers and routes may have changed
    const cards: RoutesCard[] = useMemo(() => {
        const repo = sharing.getRepo();
        return [
            {
                key: 'servers',
                title: 'Route Servers',
                description: SERVERS_DESCRIPTION,
                icon: 'route',
                summary: getServersSummary(servers.getDisplayProps().servers),
            },
            {
                key: 'sharing',
                title: 'Route Sharing',
                description: SHARING_DESCRIPTION,
                icon: 'monitor',
                summary: getSharingSummary(sharingProps.links, linkId => repo.getForLink(linkId).length),
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [servers, sharing, sharingProps, screen]);

    const handleOpenCard = useCallback((key: RoutesCardKey) => {
        logEvent({ message: 'card selected', card: key, eventSource: 'user' });
        setScreen(key);
    }, [logEvent]);

    const handleBack = useCallback(() => setScreen('section'), []);

    if (screen === 'servers') {
        return <RouteServersDialog origin="settings" onClose={handleBack} />;
    }
    if (screen === 'sharing') {
        return <RouteSharingSettings onClose={handleBack} />;
    }
    return <RoutesSettingsView cards={cards} onOpenCard={handleOpenCard} onClose={onClose} />;
};

/**
 * The "Routes" settings entry. Where Route Sharing is available it opens a section with two cards
 * (Route Servers, Route Sharing); otherwise Route Servers is the only card and opens directly.
 */
export const RoutesSettings = ({ onClose }: RoutesSettingsProps) => {
    const sharingAvailable = useRouteSharingAvailable();

    if (!sharingAvailable) {
        return <RouteServersDialog origin="settings" onClose={onClose} />;
    }
    return <RoutesSection onClose={onClose} />;
};
