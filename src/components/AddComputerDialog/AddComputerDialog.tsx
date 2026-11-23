import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalLinkClient, useRouteSharingClient } from 'incyclist-services';
import type { LocalLinkClientDisplayProps } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { AddComputerDialogView } from './AddComputerDialogView';
import type { AddComputerDialogProps } from './types';

const COUNTDOWN_INTERVAL_MS = 1000;

const getRouteCount = (
    sharing: ReturnType<typeof useRouteSharingClient>,
    linkId: string | undefined,
    logError: (err: any, fn: string) => void,
): number | undefined => {
    try {
        return linkId ? sharing.getRepo().getForLink(linkId).length : undefined;
    }
    catch (err: any) {
        logError(err, 'AddComputerDialog.getRouteCount');
        return undefined;
    }
};

export const AddComputerDialog = ({ onClose }: AddComputerDialogProps) => {
    const client = useLocalLinkClient();
    const sharing = useRouteSharingClient();
    const { logEvent, logError } = useLogging('AddComputerDialog');
    const [displayProps, setDisplayProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());
    const [now, setNow] = useState(() => Date.now());
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
    const link = displayProps.links.find(l => l.linkId === connectedId);
    const routeCount = getRouteCount(sharing, connectedId, logError);
    const syncDone = link ? link.catalogVersion !== undefined : undefined;

    return (
        <AddComputerDialogView
            discovery={displayProps.discovery}
            pairing={pairing}
            routeCount={routeCount}
            syncDone={syncDone}
            now={now}
            onCancel={handleCancel}
            onSearchAgain={handleSearchAgain}
            onSelect={handleSelect}
            onSubmitCode={handleSubmitCode}
            onRetry={handleRetry}
            onBack={handleBack}
            onOpenIosSettings={handleOpenIosSettings}
            onDone={handleDone}
        />
    );
};
