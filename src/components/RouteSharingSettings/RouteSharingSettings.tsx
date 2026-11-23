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
    const { logEvent, logError } = useLogging('RouteSharingSettings');
    const [displayProps, setDisplayProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => {
            try {
                setDisplayProps(props);
            }
            catch (err: any) {
                logError(err, 'RouteSharingSettings.onChange');
            }
        };
        try {
            client.on('state-changed', onChange);
            setDisplayProps(client.getDisplayProps());
            logEvent({ message: 'dialog shown', dialog: 'RouteSharingSettings' });

            // opening the dialog checks once, so that the dots are true when the user looks at them
            if (client.getDisplayProps().available) {
                sharing.checkAgain().catch((err: any) => logError(err, 'RouteSharingSettings.checkAgain'));
            }
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.subscribe');
        }
        return () => {
            try {
                client.off('state-changed', onChange);
            }
            catch (err: any) {
                logError(err, 'RouteSharingSettings.unsubscribe');
            }
        };
    }, [client, sharing, logEvent, logError]);

    const handleCheckAgain = useCallback(() => {
        try {
            sharing.checkAgain().catch((err: any) => logError(err, 'RouteSharingSettings.handleCheckAgain'));
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleCheckAgain');
        }
    }, [sharing, logError]);

    const handleAddComputer = useCallback(() => {
        try {
            setAdding(true);
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleAddComputer');
        }
    }, [logError]);
    const handleAddClose = useCallback(() => {
        try {
            setAdding(false);
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleAddClose');
        }
    }, [logError]);

    const handleRename = useCallback((linkId: string, name: string) => {
        try {
            client.rename(linkId, name);
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleRename');
        }
    }, [client, logError]);

    const handleForget = useCallback((linkId: string) => {
        try {
            client.forget(linkId);
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleForget');
        }
    }, [client, logError]);

    const handleOpenIosSettings = useCallback(() => {
        try {
            Linking.openSettings().catch((err: any) => logError(err, 'RouteSharingSettings.handleOpenIosSettings'));
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleOpenIosSettings');
        }
    }, [logError]);

    const handleOpenStore = useCallback(() => {
        try {
            Linking.openURL(STORE_URLS[getPlatform()]).catch((err: any) => logError(err, 'RouteSharingSettings.handleOpenStore'));
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.handleOpenStore');
        }
    }, [logError]);

    const rows = useMemo(() => {
        try {
            return displayProps.available ? toRows(displayProps, sharing.getRepo()) : [];
        }
        catch (err: any) {
            logError(err, 'RouteSharingSettings.rows');
            return [];
        }
    }, [displayProps, sharing, logError]);

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
