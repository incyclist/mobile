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
    const { logEvent, logError } = useLogging('RoutesSettings');
    const [screen, setScreen] = useState<Screen>('section');
    const [sharingProps, setSharingProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => {
            try {
                setSharingProps(props);
            }
            catch (err: any) {
                logError(err, 'RoutesSettings.onChange');
            }
        };
        try {
            client.on('state-changed', onChange);
            setSharingProps(client.getDisplayProps());
            logEvent({ message: 'dialog shown', dialog: 'RoutesSettings' });
        }
        catch (err: any) {
            logError(err, 'RoutesSettings.subscribe');
        }
        return () => {
            try {
                client.off('state-changed', onChange);
            }
            catch (err: any) {
                logError(err, 'RoutesSettings.unsubscribe');
            }
        };
    }, [client, logEvent, logError]);

    // read again whenever the rider comes back from one of the screens: servers and routes may have changed
    const cards: RoutesCard[] = useMemo(() => {
        try {
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
        }
        catch (err: any) {
            logError(err, 'RoutesSettings.cards');
            return [
                { key: 'servers', title: 'Route Servers', description: SERVERS_DESCRIPTION, icon: 'route', summary: { text: '' } },
                { key: 'sharing', title: 'Route Sharing', description: SHARING_DESCRIPTION, icon: 'monitor', summary: { text: '' } },
            ];
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [servers, sharing, sharingProps, screen]);

    const handleOpenCard = useCallback((key: RoutesCardKey) => {
        try {
            logEvent({ message: 'card selected', card: key, eventSource: 'user' });
            setScreen(key);
        }
        catch (err: any) {
            logError(err, 'RoutesSettings.handleOpenCard');
        }
    }, [logEvent, logError]);

    const handleBack = useCallback(() => {
        try {
            setScreen('section');
        }
        catch (err: any) {
            logError(err, 'RoutesSettings.handleBack');
        }
    }, [logError]);

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
