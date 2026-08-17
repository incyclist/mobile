import { unzip } from 'react-native-zip-archive';
import { Platform } from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import { name as appName } from '../../../app.json';
import { CachesDirectoryPath, DocumentDirectoryPath, downloadFile, DownloadFileOptions, exists, mkdir, readDir, unlink } from 'react-native-fs';
import { isDevVariant, isProdVariant, getAppVersion  } from '../../bindings/appInfo';
import settings from '@settings'
import { EventLogger } from 'gd-eventlog';
import { getUserSettingsBinding } from '../../bindings/user-settings';
import { getSecret } from '../../bindings/secret';


// TODO: change towards production URL
const BASE_URL_PROD = 'https://updates.incyclist.com';
const UPDATES_ROOT = `${DocumentDirectoryPath}/updates`;

// OTA is Android-only: there is no bundle:ios build script, applyUpdate() below hardcodes
// index.android.bundle, and AppDelegate never reads active_bundle_path. Without this gate iOS
// devices are only excluded by the numeric coincidence that iOS's native version currently sits
// below every minAppVersion in mobile.json - the first iOS release that crosses one would start
// downloading and unzipping an Android bundle it can never run. Extend when iOS OTA ships.
const OTA_PLATFORMS = new Set<string>(['android']);

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

const isNewerVersion = (remote: string, local: string): boolean => {
    if (!local) return true
    const remoteParts = remote.split('.').map(Number)
    const localParts = local.split('.').map(Number)
    const len = Math.max(remoteParts.length, localParts.length)
    for (let i = 0; i < len; i++) {
        const r = remoteParts[i] ?? 0
        const l = localParts[i] ?? 0
        if (r > l) return true
        if (r < l) return false
    }
    return false
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

        // iOS is excluded hard here rather than relying on version-range coincidence on the
        // server - see the OTA_PLATFORMS comment above.
        if (!OTA_PLATFORMS.has(Platform.OS)) {
            this.logger.logEvent({message:'Skipping update check: OTA not supported on this platform', platform: Platform.OS});
            return;
        }

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

            // Runs on every check, keyed on the active version rather than the response version,
            // so it isn't skipped by the `if (!response) return` below - a 404 (the normal
            // steady state, see the design doc §5) must not leave an orphaned bundle directory
            // forever. When the native gate has just reset the device, activeVersion is null and
            // this wipes all of updates/.
            await this.cleanupOldBundles(activeVersion);

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

        const appVersion = getAppVersion();

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

                // A bundle reverted by the boot-confirmation mechanism (two consecutive
                // unconfirmed boots) is blacklisted natively as failed_bundle_version. Without
                // this refusal, isNewerVersion would say yes again and it would be re-downloaded
                // identically - a slower crash loop. It stays refused until a higher bundle
                // version is published.
                const failedVersion = await DefaultPreference.get('failed_bundle_version');
                if (failedVersion && bundleVersion === failedVersion) {
                    this.logger.logEvent({message:'Refusing previously failed bundle version', bundleVersion});
                    return null
                }

                if ( isNewerVersion(bundleVersion, activeBundle)) {
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

        const appVersion = getAppVersion();

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

    private static async cleanupOldBundles(currentVersion: string | null | undefined) {
        // Keyed on currentVersion rather than compared against a fixed "old" set: when
        // currentVersion is null (e.g. right after the native gate resets the device) nothing
        // under updates/ matches, so everything is wiped - deliberate, see the caller.
        try {
            if (await exists(UPDATES_ROOT)) {
                const items = await readDir(UPDATES_ROOT);
                for (const item of items) {
                    // Directories and stray files alike - only the currently active version survives.
                    if (item.name !== currentVersion) {
                        this.logger.logEvent({message:'Cleanup old bundle',name:item.name});
                        await unlink(item.path);
                    }
                }
            }
        } catch (err:any) {
            this.logger.logEvent({message:'error', fn:'cleanupOldBundles', error:err.message, stack:err.stack})
        }

        // Stale update_*.zip files leak into CachesDirectoryPath whenever unzip fails or the
        // process dies mid-install (applyUpdate downloads before it unzips and deletes).
        try {
            if (await exists(CachesDirectoryPath)) {
                const items = await readDir(CachesDirectoryPath);
                for (const item of items) {
                    if (!item.isDirectory() && /^update_.*\.zip$/.test(item.name)) {
                        this.logger.logEvent({message:'Cleanup stale update zip',name:item.name});
                        await unlink(item.path);
                    }
                }
            }
        } catch (err:any) {
            this.logger.logEvent({message:'error', fn:'cleanupOldBundles', error:err.message, stack:err.stack})
        }
    }
}