import RNFS from 'react-native-fs';
import info from '../../../package.json';
import appJson from '../../../app.json'
import {Platform} from 'react-native';
import {v4} from 'uuid';
import DefaultPreference from 'react-native-default-preference';


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
    const {appVersion} = appJson
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
        getAppVersion:()=>appJson.appVersion,
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