import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useLocalLinkClient, useRouteSharingClient } from 'incyclist-services';
import type { LocalLinkClientDisplayProps } from 'incyclist-services';
import { useLogging } from '../../hooks';
import { AddComputerDialogView } from './AddComputerDialogView';
import type { AddComputerDialogProps } from './types';

const COUNTDOWN_INTERVAL_MS = 1000;

export const AddComputerDialog = ({ onClose }: AddComputerDialogProps) => {
    const client = useLocalLinkClient();
    const sharing = useRouteSharingClient();
    const { logEvent } = useLogging('AddComputerDialog');
    const [displayProps, setDisplayProps] = useState<LocalLinkClientDisplayProps>(() => client.getDisplayProps());
    const [now, setNow] = useState(() => Date.now());
    const refStarted = useRef(false);

    useEffect(() => {
        const onChange = (props: LocalLinkClientDisplayProps) => setDisplayProps(props);
        client.on('state-changed', onChange);
        if (!refStarted.current) {
            refStarted.current = true;
            logEvent({ message: 'dialog shown', dialog: 'AddComputerDialog' });
            // tapping Add Computer is the user action that starts the (time-boxed) search
            client.startSearch().catch(() => { /* the service reports its own failures */ });
        }
        return () => {
            client.off('state-changed', onChange);
            client.cancelSearch();
            client.cancelPairing();
        };
    }, [client, logEvent]);

    const { pairing } = displayProps;
    const waitingForRetry = pairing.step === 'failed' && pairing.retryAt !== undefined;
    useEffect(() => {
        if (!waitingForRetry) return;
        const timer = setInterval(() => setNow(Date.now()), COUNTDOWN_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [waitingForRetry]);

    const handleCancel = useCallback(() => {
        client.cancelSearch();
        client.cancelPairing();
        onClose();
    }, [client, onClose]);

    const handleSearchAgain = useCallback(() => {
        client.startSearch().catch(() => { /* the service reports its own failures */ });
    }, [client]);

    const handleSelect = useCallback((id: string) => {
        client.selectComputer(id).catch(() => { /* the service reports its own failures */ });
    }, [client]);

    const handleSubmitCode = useCallback((pin: string) => client.submitCode(pin), [client]);

    const handleRetry = useCallback(() => {
        client.retryPairing().catch(() => { /* the service reports its own failures */ });
    }, [client]);

    const handleBack = useCallback(() => client.cancelPairing(), [client]);

    const handleOpenIosSettings = useCallback(() => {
        Linking.openSettings().catch(() => { /* nothing else to offer */ });
    }, []);

    const handleDone = useCallback((name: string) => {
        if (pairing.step === 'connected' && name.trim() !== pairing.name) {
            client.rename(pairing.linkId, name);
        }
        client.cancelPairing();
        onClose();
    }, [client, pairing, onClose]);

    const connectedId = pairing.step === 'connected' ? pairing.linkId : undefined;
    const link = displayProps.links.find(l => l.linkId === connectedId);
    const routeCount = connectedId ? sharing.getRepo().getForLink(connectedId).length : undefined;
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
