import { AppState, Platform, StatusBar, useColorScheme,BackHandler, useWindowDimensions} from 'react-native';
import { SafeAreaProvider   } from 'react-native-safe-area-context';
import { MainPage } from './pages/Main/MainPage';
import { AppFeatures, IncyclistBindings, useIncyclist } from 'incyclist-services';
import { PropsWithChildren, ReactElement, useEffect,  useState } from 'react';
import { initBindings } from './bindings/factory';
import app from '../app.json'
import { useLogging } from './hooks';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';
import { getBleBinding } from './bindings/ble';
import { RootNavigator } from './pages/RootNavigator';
import { LogBox } from 'react-native';
import { getUIBinding } from './bindings/ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['new NativeEventEmitter()']);
let lastState = AppState.currentState


const SizeLogger =({ children }: PropsWithChildren<{}>): ReactElement =>{

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

export const  App =() => {
    const isDarkMode = useColorScheme() === 'dark';
    const service = useIncyclist()    
    const ble = getBleBinding()
    const [initialized,setInitialized] = useState<boolean>(false)

    const {logError,logEvent} = useLogging('Incyclist')


     

    useEffect(() => {
        const sub = AppState.addEventListener('change', nextState => {
            if (lastState === 'active' && nextState !== 'active') {
                service.onAppPause()
            }

            if (lastState !== 'active' && nextState === 'active') {
                ble.initializeAuthorization()
                service.onAppResume()
            }

             
            lastState = nextState
        })

        return () => sub.remove()
    }, [service,ble])    

    useEffect(() => {
        if (Platform.OS !== 'android') return
        const sub = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                service.onAppExit().then( ()=>{
                    getUIBinding().quit()
                } )
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
            interfaces: ['wifi','ble'],
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
        return <LoadingScreen appVersion={app.appVersion} bundleVersion={app.bundleVersion}/>
    }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
        <StatusBar hidden={true} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {initialized ? 
            <SizeLogger>
                <RootNavigator />
            
            </SizeLogger>
            : <MainPage/>}
        </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


