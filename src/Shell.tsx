import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Updated Import

import { version } from '../package.json';
import { App } from './App'; // This is your actual application
import { UpdateService } from './services';
import { EventLogger, LogAdapter } from 'gd-eventlog';
import { IncyclistBindings, useIncyclist } from 'incyclist-services';
import { initBindings } from './bindings/factory';
import app from '../app.json'
import { RNConsoleAdapter } from './bindings/logging/Adapters/RNConsoleAdapter';
import Orientation from 'react-native-orientation-locker';


export const Shell = () =>{
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isBundleLoading, setIsBundleLoading] = useState<boolean>(true);
    const [initialized, setInitialized]= useState<boolean>(false);

    const service = useIncyclist()    

    const refChecking = useRef<Promise<any>>(null)
    const refLogger = useRef<EventLogger|null>(null)
    const logger = refLogger.current

    const features = {
        interfaces: [],
        ble: '*',
        wifi: '*'
    }

    const initLogging =() =>{
        const logAdapter  = new RNConsoleAdapter( {depth:1}) as LogAdapter
        EventLogger.registerAdapter(logAdapter)
        refLogger.current = new EventLogger( app.displayName)
    }

    // Load and replace UI bundle
    useEffect(() => {
        if ( initialized || refChecking.current)
                return
        // Lock to landscape when the app starts
        Orientation.lockToLandscape();
        initLogging()
        
        const checkUpdate = async () => {
            UpdateService.checkForUpdates();

            // 2. Simple delay for Splash Screen visibility
            setTimeout(() => {
                setIsBundleLoading(false);
            }, 2000);
            refChecking.current    = null

        }
        refChecking.current  = checkUpdate();
        

    }, [initialized, isBundleLoading, isLoading ]);


    useEffect( ()=> {
        if (isBundleLoading || initialized)
            return

        const init = async()=> {

            try {

                const bindings = await initBindings()
            
                service.setBindings(bindings as IncyclistBindings)            
                refLogger.current = refLogger.current??new EventLogger('Incyclist')

                service.on('done',()=>{
                    console.log('# done')
                })
                await service.onAppLaunch( 'mobile', bindings.appInfo?.getUIVersion(), features)
                    
                setInitialized(true)
                setIsLoading(false)
            }
            catch(err:any) {
                refLogger.current?.logEvent({message:'error', error:err.message})
            }
        }

        init()      

    },[features, initialized, isBundleLoading, logger, service])


    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image 
                source={require('./assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
                />
                <Text style={styles.versionText}>Version {version}</Text>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
            </SafeAreaView>
        );
    }

  // Once loading is finished, show the main app
    return <App />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
});
