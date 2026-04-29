import { INativeUI, SelectDirectoryResult, TakeScreenshotProps } from "incyclist-services";
import { navigate } from "../../services";
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { BackHandler, Linking, NativeModules, Platform } from "react-native";
import {pickDirectory} from '@react-native-documents/picker';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import { captureScreen } from 'react-native-view-shot';
import { EventLogger } from "gd-eventlog";
import {getLocales} from 'react-native-localize'

export class UIBinding implements INativeUI {

    
    quit(): void {
        if (Platform.OS === 'android') {

            const { ExitModule } = NativeModules;
            if (ExitModule) {
                console.log('# killing app')
                ExitModule.killApp();
                return;
            }

            console.log('# killing is not available, callin fallback')
            BackHandler.exitApp();            
        }
    }
    toggleFullscreen(): void {
        return; // nothing to do UI is always full scren on mobile
    }

    // avoids that screen is turned off, because there was no user interactoin
    disableScreensaver(): void {
         activateKeepAwake();
    }

    // re-enabels screen saver that was switched off with disableSceenSaver)=
    enableScreensaver(): void {
        deactivateKeepAwake();
    }

    // take a screenshot of the current screen
    async takeScreenshot(props?: TakeScreenshotProps): Promise<string> {
        try {

            const appDir = RNFS.DocumentDirectoryPath

            const screenshotDir = `${appDir}/screenshots`;
            const destPath = `${screenshotDir}/${props?.fileName??'screenshot'}`;

            // Ensure the 'screenshots' directory exists
            const exists = await RNFS.exists(screenshotDir);
            if (!exists) {
                await RNFS.mkdir(screenshotDir);
            }  

            // Captures the screen and returns a local URI
            const tempUri = await captureScreen({
                format: 'jpg',
                quality: 0.7,
                result: 'tmpfile'
            });

            // Clean URI strings for RNFS (remove file:// prefix)
            const cleanTempPath = tempUri.replace('file://', '');
            const cleanDestPath = destPath.replace('file://', '');

            // If a file with the same name exists, remove it first
            if (await RNFS.exists(cleanDestPath)) {
                await RNFS.unlink(cleanDestPath);
            }

            // Move the temp file to the final destination
            await RNFS.moveFile(cleanTempPath, cleanDestPath);

            return `file://${cleanDestPath}`;

            
        } catch (err: any) {
            const logger = new EventLogger('UIBinding')
            logger.logEvent({message:'error', fn:'takeScreenshot', error:err.mesage, stack:err.stack})            
        }
        return ''
    }

    // open a webview of a given url
    openBrowserWindow(url: string): void {
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            }
        });
    }

    openAppWindow(url: string): void {
        // TODO: the derive the App Page based on url ( will have file:// URL)
        this.openPage(url )
    }

    // open a dialog that allows user to select a directory (to e.g. define where files should be downloaded)
    async selectDirectory(): Promise<SelectDirectoryResult> {
        try {
            // Uses system picker to let user define a target location
            const result = await pickDirectory({requestLongTermAccess: true});
            return {
                canceled: false,
                selected: result.uri,
                displayName: result.name,
            };
        } catch  {
            return { canceled: true };
        }
    }
    
    // open a dialog that shows a file in its parent folder. This allows the user to open or share this file
    showItemInFolder(fileName: string): void {
        const path = fileName.startsWith('file://') ? fileName : `file://${fileName}`;
        
        try {
            // On Mobile/tvOS, "showing in folder" is best handled by the system Share/Action sheet
            // This allows the user to copy the ride to Strava, Garmin, or Save to Files.
            Share.open({
                url: path,
                failOnCancel: false,
                saveToFiles: true, // iOS specific: enables the "Save to Files" action
            });
        } catch (err:any) {
            const logger = new EventLogger('UIBinding')
            logger.logEvent({message:'error', fn:'showItemInFolder', error:err.mesage, stack:err.stack})
            
        }
    }

    getPathForFile(_file: string): string {
        // not used in mobile 
        return ''
    }

    // detect the selected user language 
    detectLanguage(): Array<string> | string {
        const locales = getLocales();
        if (locales && locales.length > 0) {
            return locales.map(locale => locale.languageCode).filter(Boolean) as string[];
        }
        return 'en';        
    }
    openPage(route: string) {
        // Strip leading slash if business logic provides '/main'
        const screenName = route.startsWith('/') ? route.substring(1) : route;
        navigate(screenName);
    }

}

export const getUIBinding = () => new UIBinding()