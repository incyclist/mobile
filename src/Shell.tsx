import React, { useEffect, useRef, useState } from 'react';
import { App } from './App'; // This is your actual application
import { UpdateService } from './services';
import { EventLogger, LogAdapter } from 'gd-eventlog';
import { RNConsoleAdapter } from './bindings/logging/Adapters/RNConsoleAdapter';
import Orientation from 'react-native-orientation-locker';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';

import app from '../app.json'


export const Shell = () =>{
    const [isLoading, setIsLoading] = useState<boolean>(true);


    const refChecking = useRef<Promise<any>>(null)
    
    const initLogging =() =>{
        const logAdapter  = new RNConsoleAdapter( {depth:1}) as LogAdapter
        EventLogger.registerAdapter(logAdapter)
    }


    // Load and replace UI bundle
    useEffect(() => {
        if ( refChecking.current)
                return
        // Lock to landscape when the app starts
        Orientation.lockToLandscape();
        initLogging()
        
        const checkUpdate = async () => {

            // TODO: Wait with timeout, Consider termination or pause during bundle update

            UpdateService.checkForUpdates();

            // 2. Simple delay for Splash Screen visibility
            setTimeout(() => {
                setIsLoading(false);
            }, 2000);
            refChecking.current    = null

        }
        refChecking.current  = checkUpdate();
        

    }, [isLoading]);



    if (isLoading) {
        return (
            <LoadingScreen appVersion={app.appVersion} bundleVersion={app.bundleVersion}/>
        );
    }

  // Once loading is finished, show the main app
    return <App />;
}

