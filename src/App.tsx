import {
    AppState,
    Platform,
    StatusBar,
    useColorScheme,
    BackHandler,
    useWindowDimensions,
    LogBox,
    StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PropsWithChildren, ReactElement, useEffect, useRef, useState } from 'react';
import { AppFeatures, IncyclistBindings } from 'incyclist-services';
import { useIncyclist } from './services';
import { initBindings } from './bindings/factory';
import app from '../app.json';
import { useLogging, useUnmountEffect } from './hooks';
import { LoadingScreen } from './pages/LoadingScreen/LoadingScreen';
import { getBleBinding } from './bindings/ble';
import { RootNavigator } from './pages/RootNavigator';
import { getUIBinding } from './bindings/ui';
import { logDeviceInfo } from './utils/deviceInfo';
import { useOnlineStatusMonitoringInit } from './hooks/network/useOnlineStatusMonitoring';
import { MainPage } from './pages/MainPage/MainPage';
import { NavigationBar } from '@zoontek/react-native-navigation-bar';
import { SecretsStatus } from './bindings/secret/types';
import { getMessageQueueBinding  } from './bindings/mq';
import { isProdVariant } from './bindings/appInfo';

LogBox.ignoreLogs(['new NativeEventEmitter()']);
let lastState = AppState.currentState;

interface AppProps {
    secretsStatus?: SecretsStatus;
}

const DeviceInfoLogger = ({ children }: PropsWithChildren<{}>): ReactElement => {
    const refLogged = useRef(false);
    let { width, height, scale, fontScale } = useWindowDimensions();

    width = Math.floor(width);
    height = Math.floor(height);
    scale = Math.round(scale * 10) / 10;
    fontScale = Math.round(fontScale * 10) / 10;

    useEffect(() => {
        if (refLogged.current) return;

        if (width !== undefined && height !== undefined) {
            logDeviceInfo({ width, height, scale, fontScale });
            refLogged.current = true;
        }
    }, [fontScale, height, scale, width]);

    return <>{children}</>;
};

export const App = ({ secretsStatus }: AppProps) => {
    const isDarkMode = useColorScheme() === 'dark';
    const service = useIncyclist({ secretsStatus });
    const ble = getBleBinding();
    const [initialized, setInitialized] = useState<boolean>(false);

    const { logError, logEvent } = useLogging('Incyclist');

    const { stopMonitoring } = useOnlineStatusMonitoringInit();
    const refStopMonitoring = useRef<() => void>(stopMonitoring);

    useEffect(() => {
        const sub = AppState.addEventListener('change', nextState => {
            if (lastState === 'active' && nextState !== 'active') {
                service.onAppPause();
                getMessageQueueBinding().connect();  // reconnect on foreground
            }

            if (lastState !== 'active' && nextState === 'active') {
                ble.initializeAuthorization();
                service.onAppResume();
                getMessageQueueBinding().disconnect();  // disconnect on background
                
            }

            lastState = nextState;
        });

        return () => sub.remove();
    }, [service, ble]);

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            service.onAppExit().then(() => {
                getUIBinding().quit();
            });
            return false; // allow default exit
        });

        return () => sub.remove();
    }, [service]);

    useEffect(() => {
        if (initialized) return;

        logEvent({ message: 'Initializing App' });

        const features: AppFeatures = {
            interfaces: ['wifi', 'ble'],
            ble: '*',
            wifi: '*',
        };

        const init = async () => {
            try {
                const bindings = await initBindings();
                service.setBindings(bindings as IncyclistBindings);

                getMessageQueueBinding().connect()

                const uiVersion = bindings.appInfo?.getUIVersion() ?? app.bundleVersion;
                await service.onAppLaunch('mobile', uiVersion, features);

                
                logEvent({ message: 'Initializing App done', isProdVariant  });
                setInitialized(true);
            } catch (err: any) {
                logError(err, 'App.init');
            }
        };

        init();
    }, [initialized, logError, logEvent, service]);

    useUnmountEffect(() => {
        refStopMonitoring?.current();
    });

    if (!initialized) {
        
        return <LoadingScreen appVersion={app.appVersion} bundleVersion={app.bundleVersion} statusMessage='connecting ...' />;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <StatusBar hidden={true} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <NavigationBar hidden={true} />
                {initialized ? (
                    <DeviceInfoLogger>
                        <RootNavigator />
                    </DeviceInfoLogger>
                ) : (
                    <MainPage />
                )}
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});