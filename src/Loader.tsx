import React, { useEffect, useRef, useState } from 'react';
import { App } from './App'; // This is your actual application
import { initRestLogging  } from './services';

import { EventLogger, LogAdapter } from 'gd-eventlog';
import { RNConsoleAdapter } from './bindings/logging/Adapters/RNConsoleAdapter';
import Orientation from 'react-native-orientation-locker';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';

import app from '../app.json'
import { UpdateService } from './services/UpdateManager';
import { initSecrets } from './bindings/secret';
import { SecretsStatus } from './bindings/secret/types';

export const Loader = () =>{
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [statusMessage, setStatusMessage] = useState<string>('Starting up...');
    const [secretsStatus, setSecretsStatus] = useState<SecretsStatus>('ok');

    const refChecking = useRef<Promise<any> | null>(null)
    
    const initLogging =() =>{
        const logAdapter  = new RNConsoleAdapter( {depth:1}) as LogAdapter
        EventLogger.registerAdapter(logAdapter)

        initRestLogging()
    }

    useEffect(() => {
        if ( refChecking.current)
            return
        
        Orientation.lockToLandscape();
        initLogging()
        
        const run = async () => {

            setStatusMessage('Setting up infrastructure...');
            const status = await initSecrets({ timeout: 7000 });
            setSecretsStatus(status);

            setStatusMessage('Checking for updates...');
            UpdateService.checkForUpdates();

            setStatusMessage('Almost ready...');
            setIsLoading(false);
            refChecking.current    = null
        }
        refChecking.current  = run();
        

    }, []);


    if (isLoading) {
        return (
            <LoadingScreen 
                appVersion={app.appVersion} 
                bundleVersion={app.bundleVersion}
                statusMessage={statusMessage}
            />
        );
    }

    return <App secretsStatus={secretsStatus} />;
}