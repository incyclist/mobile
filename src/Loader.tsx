import React, { useEffect, useRef, useState } from 'react';
import { App } from './App'; // This is your actual application
import { ApiConfiguration, initRestLogging  } from './services';

import { EventLogger, LogAdapter } from 'gd-eventlog';
import { RNConsoleAdapter } from './bindings/logging/Adapters/RNConsoleAdapter';
import Orientation from 'react-native-orientation-locker';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';

import app from '../app.json'
import { UpdateService } from './services/UpdateManager';
import { getSecret, getSecretsStatus, initSecrets } from './bindings/secret';
import { SecretsStatus } from './bindings/secret/types';
import { getUserSettingsBinding } from './bindings/user-settings';

const initApi = async ()=> {
    const apiKey = getSecret('INCYCLIST_API_KEY');
    if (apiKey) {
        ApiConfiguration.getInstance().addHeader('x-api-key', apiKey);
    }

    const userSettingsBinding = getUserSettingsBinding();
    await userSettingsBinding.getAll();

    const uuid = userSettingsBinding.getValue('uuid', null);   
    if (uuid) {        
        ApiConfiguration.getInstance().addHeader('x-uuid', uuid);
    }

}

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

        
        
        const run = async () => {

            await initLogging()

            setStatusMessage('Setting up infrastructure...');
            await initSecrets({ timeout: 7000 });
            const status = getSecretsStatus()
            setSecretsStatus(status);

            initApi()

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