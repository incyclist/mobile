import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalLinkClient, useRouteSharingClient } from 'incyclist-services';
import type { LinkSyncState, LocalLinkClientDisplayProps, SyncStateName } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { AddComputerDialogView } from './AddComputerDialogView';
import type { AddComputerDialogProps } from './types';

const COUNTDOWN_INTERVAL_MS = 1000;

interface SyncInfo {
    state?: SyncStateName;
    routeCount?: number;
}

const getSyncInfo = (
    sharing: ReturnType<typeof useRouteSharingClient>,
    linkId: string | undefined,
    logError: (err: any, fn: string) => void,
): SyncInfo => {
    try {
        if (!linkId) return {};
        const sync = sharing.getSyncState(linkId);
        return { state: sync.state, routeCount: sync.routeCount ?? sharing.getRepo().getForLink(linkId).length };
    }
    catch (err: any) {
        logError(err, 'AddComputerDialog.getSyncInfo');
        return {};
    }
};

export const AddComputerDialog = ({ onClose }: AddComputerDialogProps) => {
    const client = useLocalLinkClient();
    const sharing = useRouteSharingClient();
    const { logEvent, logError } = useLogging('AddComputerDialog');
    const [displayProps, setDisplayProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());
    const [now, setNow] = useState(() => Date.now());
    const [, setSyncTick] = useState(0);
    const refStarted = useRef(false);

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => {
            try {
                setDisplayProps(props);
            }
            catch (err: any) {
                logError(err, 'AddComputerDialog.onChange');
            }
        };
        try {
            client.on('state-changed', onChange);
            if (!refStarted.current) {
                refStarted.current = true;
                logEvent({ message: 'dialog shown', dialog: 'AddComputerDialog' });
                // tapping Add Computer is the user action that starts the (time-boxed) search
                client.startSearch().catch((err: any) => logError(err, 'AddComputerDialog.startSearch'));
            }
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.subscribe');
        }
        return () => {
            try {
                client.off('state-changed', onChange);
                client.cancelSearch();
                client.cancelPairing();
            }
            catch (err: any) {
                logError(err, 'AddComputerDialog.unsubscribe');
            }
        };
    }, [client, logEvent, logError]);

    useEffect(() => {
        const onSync = (_state: LinkSyncState) => {
            try {
                setSyncTick(tick => tick + 1);
            }
            catch (err: any) {
                logError(err, 'AddComputerDialog.onSyncState');
            }
        };
        try {
            sharing.on('sync-state', onSync);
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.subscribeSync');
        }
        return () => {
            try {
                sharing.off('sync-state', onSync);
            }
            catch (err: any) {
                logError(err, 'AddComputerDialog.unsubscribeSync');
            }
        };
    }, [sharing, logError]);

    const { pairing } = displayProps;
    const waitingForRetry = pairing.step === 'failed' && pairing.retryAt !== undefined;
    useEffect(() => {
        if (!waitingForRetry) return;
        const timer = setInterval(() => {
            try {
                setNow(Date.now());
            }
            catch (err: any) {
                logError(err, 'AddComputerDialog.countdown');
            }
        }, COUNTDOWN_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [waitingForRetry, logError]);

    const handleCancel = useCallback(() => {
        try {
            client.cancelSearch();
            client.cancelPairing();
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleCancel');
        }
        onClose();
    }, [client, onClose, logError]);

    const handleSearchAgain = useCallback(() => {
        try {
            client.startSearch().catch((err: any) => logError(err, 'AddComputerDialog.handleSearchAgain'));
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleSearchAgain');
        }
    }, [client, logError]);

    const handleSelect = useCallback((id: string) => {
        try {
            client.selectComputer(id).catch((err: any) => logError(err, 'AddComputerDialog.handleSelect'));
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleSelect');
        }
    }, [client, logError]);

    const handleSubmitCode = useCallback((pin: string) => {
        try {
            client.submitCode(pin);
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleSubmitCode');
        }
    }, [client, logError]);

    const handleRetry = useCallback(() => {
        try {
            client.retryPairing().catch((err: any) => logError(err, 'AddComputerDialog.handleRetry'));
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleRetry');
        }
    }, [client, logError]);

    const handleBack = useCallback(() => {
        try {
            client.cancelPairing();
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleBack');
        }
    }, [client, logError]);

    const handleCheckAgain = useCallback(() => {
        try {
            logEvent({ message: 'button clicked', button: 'check again', eventSource: 'user' });
            sharing.checkAgain().catch((err: any) => logError(err, 'AddComputerDialog.handleCheckAgain'));
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleCheckAgain');
        }
    }, [sharing, logEvent, logError]);

    const handleOpenIosSettings = useCallback(() => {
        try {
            Linking.openSettings().catch((err: any) => logError(err, 'AddComputerDialog.handleOpenIosSettings'));
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleOpenIosSettings');
        }
    }, [logError]);

    const handleDone = useCallback((name: string) => {
        try {
            if (pairing.step === 'connected' && name.trim() !== pairing.name) {
                client.rename(pairing.linkId, name);
            }
            client.cancelPairing();
        }
        catch (err: any) {
            logError(err, 'AddComputerDialog.handleDone');
        }
        onClose();
    }, [client, pairing, onClose, logError]);

    const connectedId = pairing.step === 'connected' ? pairing.linkId : undefined;
    const { state: syncState, routeCount } = getSyncInfo(sharing, connectedId, logError);

    return (
        <AddComputerDialogView
            discovery={displayProps.discovery}
            pairing={pairing}
            routeCount={routeCount}
            syncState={syncState}
            now={now}
            onCancel={handleCancel}
            onSearchAgain={handleSearchAgain}
            onSelect={handleSelect}
            onSubmitCode={handleSubmitCode}
            onRetry={handleRetry}
            onBack={handleBack}
            onOpenIosSettings={handleOpenIosSettings}
            onCheckAgain={handleCheckAgain}
            onDone={handleDone}
        />
    );
};
