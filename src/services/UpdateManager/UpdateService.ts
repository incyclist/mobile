import { unzip } from 'react-native-zip-archive';
import DefaultPreference from 'react-native-default-preference';
import { name as appName, appVersion } from '../../../app.json';
import { CachesDirectoryPath, DocumentDirectoryPath, downloadFile, DownloadFileOptions, exists, mkdir, readDir, unlink } from 'react-native-fs';
import { isDevVariant, isProdVariant  } from '../../bindings/appInfo';
import settings from '@settings'
import { EventLogger } from 'gd-eventlog';
import { getUserSettingsBinding } from '../../bindings/user-settings';
import { getSecret } from '../../bindings/secret';


// TODO: change towards production URL
const BASE_URL_PROD = 'https://updates.incyclist.com';
const UPDATES_ROOT = `${DocumentDirectoryPath}/updates`;

interface IAppBundleResponse {
  appVersion: string;
  bundleVersion: string;
  bundleUrl: string;
  setting?: object;
}


const getBaseUrl = async (): Promise<string> => {
    let baseUrl = BASE_URL_PROD;
    const s = (settings ?? {}) as Record<string, string>
    baseUrl = s.UPDATE_SERVER_URL ?? BASE_URL_PROD
    return baseUrl
}

const createNewDir = async (path:string) =>{    
    if (await exists(path)) 
        await unlink(path);
    await mkdir(path);
}



export class UpdateService {

    private static  _logger:EventLogger

    static get logger ()  {
        this._logger = this._logger??new EventLogger('UpdateService')
        return this._logger
    }



    /**
     * Main entry point to check and apply updates
     */
    static async checkForUpdates() {


        this.logger.logEvent( {message:'check for updates', isDevVariant, isProdVariant})

        // 1. Skip if in Debug (Development) mode
        if (isDevVariant) {
            this.logger.logEvent({message:'Skipping update check in Debug mode.'});
            return;
        }


        try {
            const userSettingsBinding = getUserSettingsBinding();
            await userSettingsBinding.getAll();
            const uuid = userSettingsBinding.getValue('uuid', null);

            if (!uuid) {
                this.logger.logEvent({ message: 'Skipping update check: No UUID found.' });
                return;
            }

            const bundleApiKey = getSecret('INCYCLIST_API_KEY');

            const activePath = await DefaultPreference.get('active_bundle_path');
            const fileExists = await exists(`${activePath}/index.android.bundle`);
            const activeVersion = await DefaultPreference.get('active_bundle_version');
            if (fileExists) {
                this.logger.logEvent({message:'Current bundle',path:activePath,bundleVersion:activeVersion });
            }
            else {
                this.logger.logEvent({message:'Current bundle',path:'<app-bundle>'});
            }

            const response = await this.fetchBundleInfo(activeVersion, uuid, bundleApiKey);
            if (!response) return;

            await this.applyUpdate(response, uuid, bundleApiKey);
            await this.cleanupOldBundles(response.bundleVersion);
            
        } catch (err:any) {
            this.logger.logEvent({message:'error', fn:'checkForUpdates', error:err.message, stack:err.stack})
        }
    }

    private static async fetchBundleInfo(activeVersion: string | null | undefined, uuid: string, bundleApiKey?: string): Promise<IAppBundleResponse | null> {
        const BASE_URL = await getBaseUrl()
        const url = `${BASE_URL}/api/v1/apps/${appName}`;

        this.logger.logEvent({message:'Request bundle info',url});

        const headers: Record<string, string> = {
            'x-uuid': uuid,
            'x-app-channel': 'mobile',
            'x-app-version': appVersion,
            'Accept': 'application/json',
        };

        if (bundleApiKey) {
            headers['x-api-key'] = bundleApiKey;
        }


        try {
            const res = await fetch(url, { headers });
            if (res.ok) {
                const info = await res.json() as IAppBundleResponse;
                const bundleVersion = info.bundleVersion as string
                const activeBundle = activeVersion??''

                if ( activeBundle !== bundleVersion) {
                    this.logger.logEvent({message:'Bundle update available',bundleVersion:bundleVersion});                    
                    return info
                }    
            }

        }
        catch {}

        this.logger.logEvent({message:'No bundle update available'});                    
        return null
    }


    private static async applyUpdate(bundleInfo: IAppBundleResponse, uuid: string, bundleApiKey?: string) {
        const versionDir = `${UPDATES_ROOT}/${bundleInfo.bundleVersion}`;
        const zipPath = `${CachesDirectoryPath}/update_${bundleInfo.bundleVersion}.zip`;
        const {bundleUrl,bundleVersion} = bundleInfo


        await createNewDir(versionDir)

        const BASE_URL = await getBaseUrl()
        const url = bundleInfo.bundleUrl?.startsWith('http') ?  bundleUrl : `${BASE_URL}${bundleUrl}`

        const headers: Record<string, string> = {
            'x-uuid': uuid,
            'x-app-channel': 'mobile',
            'x-app-version': appVersion,
            'Accept': 'application/json',
        };

        if (bundleApiKey) {
            headers['x-api-key'] = bundleApiKey;
        }

        const options: DownloadFileOptions = {
            fromUrl: url,
            toFile: zipPath,
            headers,
        };    

        try {
            this.logger.logEvent({message:'Downloading bundle',bundleVersion,url});                    
            const download = downloadFile(options);
            const result = await download.promise;

            if (result.statusCode !== 200) {
                this.logger.logEvent({message:'Downloading bundle failed ',bundleVersion,url, reason:`Server returned status ${result.statusCode}`});                    
                return false;
            }        
        }
        catch(err : any) {
            this.logger.logEvent({message:'Downloading bundle failed ',bundleVersion,url, reason:err.message});                    
            return false
        }

        // Unzip to the versioned folder
        this.logger.logEvent({message:'Installing Bundle',bundleVersion, path:versionDir});                    
        await unzip(zipPath, versionDir);

        await unlink(zipPath); // Cleanup temp zip

        // Mark as active for the NEXT boot
        await DefaultPreference.set('active_bundle_version', bundleInfo.bundleVersion);
        await DefaultPreference.set('active_bundle_path', versionDir);

        this.logger.logEvent({message:'Bundle installed successfully',bundleVersion});                    
    }

    private static async cleanupOldBundles(currentVersion: string) {
        try {
            if (!(await exists(UPDATES_ROOT))) return;
            
            const items = await readDir(UPDATES_ROOT);
            for (const item of items) {
                // If the folder name doesn't match the one we just activated, delete it
                if (item.isDirectory() && item.name !== currentVersion) {
                    this.logger.logEvent({message:'Cleanup old bundle',bundleVersion:item.name});                    
                    
                    await unlink(item.path);
                }
            }
        } catch (err:any) {
            this.logger.logEvent({message:'error', fn:'cleanupOldBundles', error:err.message, stack:err.stack})
        }
    }
}