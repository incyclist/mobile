import React, { useState, useCallback } from 'react';
import { useAppsService } from 'incyclist-services';
import { KomootLoginDialogView } from './KomootLoginDialogView';
import { KomootLoginDialogProps } from './types';
import { useLogging } from '../../hooks';

export const KomootLoginDialog = ({ onSuccess, onCancel }: KomootLoginDialogProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userid, setUserid] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const { logEvent } = useLogging('KomootLoginDialog');
    const service = useAppsService();

    const handleConnect = useCallback(async () => {
        logEvent({ message: 'komoot login start', eventSource: 'user' });
        setIsConnecting(true);
        setErrorMessage(undefined);
        try {
            await service.connect('komoot', { username, password, userid });
            logEvent({ message: 'komoot login success' });
            onSuccess?.();
        } catch (err: any) {
            const error = err.message || 'Unknown error';
            logEvent({ message: 'komoot login failed', error });
            setErrorMessage(error);
        } finally {
            setIsConnecting(false);
        }
    }, [username, password, userid, service, onSuccess, logEvent]);

    return (
        <KomootLoginDialogView
            username={username}
            password={password}
            userid={userid}
            isConnecting={isConnecting}
            errorMessage={errorMessage}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onUseridChange={setUserid}
            onConnect={handleConnect}
            onCancel={onCancel}
        />
    );
};