import { AppState, Platform, StatusBar, useColorScheme,BackHandler, ModalBaseProps, useWindowDimensions} from 'react-native';
import { SafeAreaProvider   } from 'react-native-safe-area-context';
import { MainPage } from './pages/Main/MainPage';
import { AppFeatures, IncyclistBindings, useIncyclist } from 'incyclist-services';
import { FC, ReactElement, useEffect, useState } from 'react';
import { initBindings } from './bindings/factory';
import app from '../app.json'
import { PairingPage } from './pages/PairingPage/PairingPage';
import { useLogging } from './hooks';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';

let lastState = AppState.currentState

export const  App =() => {
    const isDarkMode = useColorScheme() === 'dark';
    const service = useIncyclist()    
    const [initialized,setInitialized] = useState<boolean>(false)

    const {logError,logEvent} = useLogging('Incyclist')
     

    useEffect(() => {
        const sub = AppState.addEventListener('change', nextState => {
            if (lastState === 'active' && nextState !== 'active') {
                service.onAppPause()
            }

            if (lastState !== 'active' && nextState === 'active') {
                service.onAppResume()
            }

             
            lastState = nextState
        })

        return () => sub.remove()
    }, [service])    

    useEffect(() => {
        if (Platform.OS !== 'android') return
        const sub = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                service.onAppExit()
                return false // allow default exit
            }
        )

        return () => sub.remove()
    }, [service])

    useEffect( ()=> {

        if (initialized)
            return;

        logEvent({message:'Initializing App'})

        const features:AppFeatures = {
            interfaces: ['wifi'],
            ble: '*',
            wifi: '*'
        }

        const init = async()=> {

            try {

                const bindings = await initBindings()
                service.setBindings(bindings as IncyclistBindings)            
                

                const uiVersion = bindings.appInfo?.getUIVersion()??app.bundleVersion
                await service.onAppLaunch( 'mobile', uiVersion, features)               
                logEvent({message:'Initializing App done'})
                setInitialized(true)
            }
            catch(err:any) {
                logError(err,'App.init')
            }
        }

        init()      

    },[initialized, logError, logEvent, service])


    if (!initialized) {
        return <LoadingScreen version={app.bundleVersion}/>
    }
    
    const SizeLogger =({children}): ReactElement =>{

        let {width,height,scale,fontScale} = useWindowDimensions()

        width = Math.floor(width)
        height = Math.floor(width)
        scale = Math.round(scale*10)/10
        fontScale = Math.round(fontScale*10)/10
        

        const {logEvent} = useLogging('Incyclist')
        logEvent({message:'display size', width, height, scale, fontScale})
        return (
        <>
        {children}
        </>
        )
        
    }


  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {initialized ? 
        <SizeLogger>
            <PairingPage/>
        </SizeLogger>
         : <MainPage/>}
    </SafeAreaProvider>
  );
}


