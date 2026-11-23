import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import info from '../../../package.json';
import appJson from '../../../app.json'
import {Platform} from 'react-native';
import {v4} from 'uuid';
import DefaultPreference from 'react-native-default-preference';
import settings from '@settings';
import { EventLogger } from 'gd-eventlog';
import { hasNativeFeature } from '../nativeCapabilities';

const logError = (err: any, fn: string): void => {
    try {
        new EventLogger('AppInfo').logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack });
    } catch {
        // nothing left to report to
    }
};

export const getOS = () => {
    const arch = 'react-native';
    try {
        const platform = Platform.OS;
        const release = Platform.Version.toString();
        return {platform, arch, release};
    }
    catch (err: any) {
        logError(err, 'getOS');
        return {platform: 'unknown', arch, release: ''};
    }
};

export const getChannel = ():AppChannel=> {
    return 'mobile' as AppChannel
}

/**
 * The real installed native app version - the single place this value is defined.
 *
 * appJson.appVersion must never be used for this: it is baked into the JS bundle at build time,
 * and that bundle is served as a hot update to every installed native version, so it would report
 * the same value on every device regardless of what native version is actually installed.
 */
export const getAppVersion = ():string => {
    try {
        return DeviceInfo.getVersion();
    }
    catch (err: any) {
        logError(err, 'getAppVersion');
        return '';
    }
};

export const getAppInfo = () => {
    try {
        const {name} = info;
        const appVersion = getAppVersion();
        const appDir = RNFS.DocumentDirectoryPath;
        const tempDir = RNFS.TemporaryDirectoryPath;

        return {version:appVersion, name, appDir, tempDir};
    }
    catch (err: any) {
        logError(err, 'getAppInfo');
        return {version:'', name:'', appDir:'', tempDir:''};
    }
};

type AppChannel = 'desktop' | 'mobile' | 'web' | 'tv' | 'backend';

let activeVersion:string|undefined|null;
let session:string|undefined;

const readActiveVersion = async (): Promise<string|undefined|null> => {
    try {
        return await DefaultPreference.get('active_bundle_version');
    }
    catch (err: any) {
        logError(err, 'readActiveVersion');
        return undefined;
    }
};

const getUIVersion = (): string => {
    try {
        const {bundleVersion} = info as any;
        return activeVersion??bundleVersion??appJson.bundleVersion
    }
    catch (err: any) {
        logError(err, 'getUIVersion');
        return '';
    }
};

const getAppDir = (): string => {
    try {
        return RNFS.DocumentDirectoryPath;
    }
    catch (err: any) {
        logError(err, 'getAppDir');
        return '';
    }
};

const getTempDir = (): string => {
    try {
        return RNFS.TemporaryDirectoryPath;
    }
    catch (err: any) {
        logError(err, 'getTempDir');
        return '';
    }
};

const getChannelSafe = (): AppChannel => {
    try {
        return getChannel();
    }
    catch (err: any) {
        logError(err, 'getChannel');
        return 'mobile';
    }
};

export const getAppInfoBinding = async () => {

    try {
        activeVersion = activeVersion ?? await readActiveVersion();
        session = session ?? v4()
    }
    catch (err: any) {
        logError(err, 'getAppInfoBinding');
        session = session ?? 'unknown'
    }

    return {
        getOS,
        getAppVersion,
        getUIVersion,
        getAppDir,
        getSourceDir:()=>'',
        getTempDir,
        isApp:()=>false,
        getChannel:getChannelSafe,
        hasNativeFeature,
        session
    }

}

export const isDevVariant = __DEV__;
export const isProdVariant = settings.APP_ENV === 'production';