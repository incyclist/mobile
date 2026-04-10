import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppsOperation, useAppsService } from 'incyclist-services';
import { KomootSettingsProps } from './types';
import { KomootSettingsView } from './KomootSettingsView';
import { OperationConfig } from '../OperationsSelector/types';
import { useLogging } from '../../hooks/logging';
import { useUnmountEffect } from '../../hooks/unmount';

export const KomootSettings = ({ onBack }: KomootSettingsProps) => {
    const service = useAppsService();
    const { logEvent } = useLogging('KomootSettings');

    const refInitialized = useRef<boolean>(false);

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
    const [operations, setOperations] = useState<OperationConfig[]>([]);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        const initial = service.openAppSettings('komoot');
        if (initial) {
            setIsConnected(initial.isConnected ?? false);
            setOperations((initial.operations as OperationConfig[]) ?? []);
        }
        logEvent({ message: 'komoot settings opened' });
    }, [service, logEvent]);

    useUnmountEffect(() => {
        service.closeAppSettings('komoot');
    });

    const handleConnect = useCallback(() => {
        setIsConnecting(true);
        setShowLoginDialog(true);
    }, []);

    const handleLoginSuccess = useCallback(() => {
        setShowLoginDialog(false);
        const updated = service.openAppSettings('komoot');
        if (updated) {
            setIsConnected(updated.isConnected ?? false);
            setOperations((updated.operations as OperationConfig[]) ?? []);
        }
        setIsConnecting(false);
    }, [service]);

    const handleLoginCancel = useCallback(() => {
        setShowLoginDialog(false);
        setIsConnecting(false);
    }, []);

    const handleDisconnect = useCallback(() => {
        service.disconnect('komoot');
        setIsConnected(false);
        setOperations([]);
        setIsConnecting(false);
    }, [service]);

    const handleOperationsChanged = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            const updated = service.enableOperation('komoot', operation, enabled);
            setOperations((updated as OperationConfig[]) ?? []);
        },
        [service],
    );

    return (
        <KomootSettingsView
            isConnected={isConnected}
            isConnecting={isConnecting}
            operations={operations}
            showLoginDialog={showLoginDialog}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onOperationsChanged={handleOperationsChanged}
            onLoginSuccess={handleLoginSuccess}
            onLoginCancel={handleLoginCancel}
            onBack={onBack}
        />
    );
};