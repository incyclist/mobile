import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import info from '../../../package.json';
import appJson from '../../../app.json'
import {Platform} from 'react-native';
import {v4} from 'uuid';
import DefaultPreference from 'react-native-default-preference';
import settings from '@settings';

export const getOS = () => {
    const arch = 'react-native';
    const platform = Platform.OS;
    const release = Platform.Version.toString();
    return {platform, arch, release};
};

export const getChannel = ():AppChannel=> {
    return 'mobile' as AppChannel
}

export const getAppInfo = () => {
    const {name} = info;
    // DeviceInfo.getVersion() reads the real installed native app version. appJson.appVersion
    // must not be used here: it is baked into this JS bundle at build time, and this bundle is
    // served as a hot update to every installed native version, so it would report the same
    // value on every device regardless of what native version is actually installed.
    const appVersion = DeviceInfo.getVersion();
    const appDir = RNFS.DocumentDirectoryPath;
    const tempDir = RNFS.TemporaryDirectoryPath;

    return {version:appVersion, name, appDir, tempDir};
};

type AppChannel = 'desktop' | 'mobile' | 'web' | 'tv' | 'backend';

let activeVersion:string|undefined|null;
let session:string|undefined;

export const getAppInfoBinding = async () => {

    activeVersion = activeVersion ?? await DefaultPreference.get('active_bundle_version'); 
    session = session ?? v4()

    const getUIVersion = ()=> { 
        const {bundleVersion} = info as any;       
        return activeVersion??bundleVersion??appJson.bundleVersion
    }

    return {
        getOS,
        // Real installed native version - see getAppInfo() above for why appJson.appVersion is wrong here.
        getAppVersion:()=>DeviceInfo.getVersion(),
        getUIVersion,
        getAppDir:()=>RNFS.DocumentDirectoryPath,
        getSourceDir:()=>'',
        getTempDir:()=>RNFS.TemporaryDirectoryPath,
        isApp:()=>false,
        getChannel:()=>getChannel(),
        session
    }

}

export const isDevVariant = __DEV__;
export const isProdVariant = settings.APP_ENV === 'production';