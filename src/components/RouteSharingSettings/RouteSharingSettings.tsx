import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useLocalLinkClient, useRouteSharingClient } from 'incyclist-services';
import type { LocalLinkClientDisplayProps, SharedRouteRepo } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { AddComputerDialog } from '../AddComputerDialog';
import { RouteSharingSettingsView } from './RouteSharingSettingsView';
import type { RouteSharingPlatform, RouteSharingRow, RouteSharingSettingsProps } from './types';

// The numeric App Store id is not known to this repo: the search opens the store listing by name.
const STORE_URLS: Record<RouteSharingPlatform, string> = {
    ios: 'itms-apps://search.itunes.apple.com/WebObjects/MZSearch.woa/wa/search?q=Incyclist',
    android: 'market://details?id=com.incyclist.app',
};

const getPlatform = (): RouteSharingPlatform => Platform.OS === 'ios' ? 'ios' : 'android';

const toRows = (props: LocalLinkClientDisplayProps, repo: SharedRouteRepo): RouteSharingRow[] => {
    return props.links.map(link => ({
        linkId: link.linkId,
        name: link.displayName,
        reachability: link.reachability,
        routeCount: repo.getForLink(link.linkId).length,
        lastSeenAt: link.lastSeenAt,
        addingRoutes: link.reachability === 'reachable' && link.catalogVersion === undefined,
    }));
};

const getMode = (props: LocalLinkClientDisplayProps): 'unsupported' | 'empty' | 'list' => {
    if (!props.available) return 'unsupported';
    return props.links.length === 0 ? 'empty' : 'list';
};

export const RouteSharingSettings = ({ onClose }: RouteSharingSettingsProps) => {
    const client = useLocalLinkClient();
    const sharing = useRouteSharingClient();
    const { logEvent } = useLogging('RouteSharingSettings');
    const [displayProps, setDisplayProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => setDisplayProps(props);
        client.on('state-changed', onChange);
        setDisplayProps(client.getDisplayProps());
        logEvent({ message: 'dialog shown', dialog: 'RouteSharingSettings' });

        // opening the dialog checks once, so that the dots are true when the user looks at them
        if (client.getDisplayProps().available) {
            sharing.checkAgain().catch(() => { /* the service reports its own failures */ });
        }
        return () => {
            client.off('state-changed', onChange);
        };
    }, [client, sharing, logEvent]);

    const handleCheckAgain = useCallback(() => {
        sharing.checkAgain().catch(() => { /* the service reports its own failures */ });
    }, [sharing]);

    const handleAddComputer = useCallback(() => setAdding(true), []);
    const handleAddClose = useCallback(() => setAdding(false), []);

    const handleRename = useCallback((linkId: string, name: string) => {
        client.rename(linkId, name);
    }, [client]);

    const handleForget = useCallback((linkId: string) => {
        client.forget(linkId);
    }, [client]);

    const handleOpenIosSettings = useCallback(() => {
        Linking.openSettings().catch(() => { /* nothing else to offer */ });
    }, []);

    const handleOpenStore = useCallback(() => {
        Linking.openURL(STORE_URLS[getPlatform()]).catch(() => { /* nothing else to offer */ });
    }, []);

    const rows = useMemo(() => (displayProps.available ? toRows(displayProps, sharing.getRepo()) : []), [displayProps, sharing]);

    if (adding) {
        return <AddComputerDialog onClose={handleAddClose} />;
    }

    return (
        <RouteSharingSettingsView
            mode={getMode(displayProps)}
            rows={rows}
            checking={displayProps.checking}
            searchBlocked={displayProps.searchBlocked !== undefined}
            platform={getPlatform()}
            onClose={onClose}
            onCheckAgain={handleCheckAgain}
            onAddComputer={handleAddComputer}
            onRename={handleRename}
            onForget={handleForget}
            onOpenIosSettings={handleOpenIosSettings}
            onOpenStore={handleOpenStore}
        />
    );
};
