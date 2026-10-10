import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { App } from './App'; // This is your actual application
import { ApiConfiguration, initRestLogging  } from './services';

import { EventLogger, LogAdapter } from 'gd-eventlog';
import { getLogBacklog } from './bindings/logging/Adapters/BacklogAdapter';
import { RNConsoleAdapter } from './bindings/logging/Adapters/RNConsoleAdapter';
import Orientation from 'react-native-orientation-locker';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';

import app from '../app.json'
import DefaultPreference from 'react-native-default-preference';
import { UpdateService } from './services/UpdateManager';
import { getSecret, getSecretsStatus, initSecrets } from './bindings/secret';
import { SecretsStatus } from './bindings/secret/types';
import { getUserSettingsBinding } from './bindings/user-settings';
import { getAppVersion } from './bindings/appInfo';

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

// Module-level, not component state: survives a root remount (the same JS runtime mounting a
// fresh Loader/App tree, e.g. an Android Activity destroyed and recreated without a process
// restart - see design/features/root-remount-resilience/architecture.md). `refChecking` below
// only guards re-entrancy within one component instance; it resets to null on every mount, so
// it cannot detect this case by itself. This counter is the primary frequency signal for how
// often it actually happens in production.
let mountCount = 0

export const Loader = () =>{
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [statusMessage, setStatusMessage] = useState<string>('Starting up...');
    const [secretsStatus, setSecretsStatus] = useState<SecretsStatus>('ok');

    const refChecking = useRef<Promise<any> | null>(null)

    const initLogging =() =>{
        // Registered first, so nothing logged between here and the REST adapter coming up
        // is lost. initRestLogging() cannot run any earlier - it needs the settings - and
        // EventLogger drops each event once the adapters registered at that moment have
        // seen it, so without this the early startup events never reach the server.
        EventLogger.registerAdapter(getLogBacklog())

        const logAdapter  = new RNConsoleAdapter( {depth:1}) as LogAdapter
        EventLogger.registerAdapter(logAdapter)

        initRestLogging()

    }

    useEffect(() => {
        if ( refChecking.current)
            return

        mountCount += 1
        if (mountCount > 1) {
            // initRestLogging()/onAppLaunch() are independently idempotent (see their own
            // guards), so re-running the rest of this effect on a remount is harmless - but it
            // still happening at all is the thing worth knowing about.
            new EventLogger('Incyclist').logEvent({ message: 'app root remounted', mountCount, appState: AppState.currentState })
        }

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

            // Boot confirmation: the app is demonstrably alive, so clear the natively-incremented
            // failure counter before it reaches the two-strikes threshold that reverts to the
            // embedded bundle. See MainApplication.kt's reactHost lazy block.
            await DefaultPreference.set('bundle_boot_failures', '0');

            setIsLoading(false);
            refChecking.current    = null
        }

        refChecking.current  = run();
        

    }, []);


    if (isLoading) {
        return (
            <LoadingScreen
                appVersion={getAppVersion()}
                bundleVersion={app.bundleVersion}
                statusMessage={statusMessage}
            />
        );
    }

    return <App secretsStatus={secretsStatus} />;
}