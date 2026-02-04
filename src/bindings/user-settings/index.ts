import RNFS from 'react-native-fs';
import {getAppInfo} from '../appInfo';
import defSettings from '@settings'
import { IUserSettingsBinding } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';

class UserSettingsImplementation implements IUserSettingsBinding {
    protected static _instance: UserSettingsImplementation;

    protected savePromise: Promise<void> | null;
    protected settings?: {[key: string]: any};
    protected logger: EventLogger;

    static getInstance(): UserSettingsImplementation {
        if (!UserSettingsImplementation._instance) {
            UserSettingsImplementation._instance =
                new UserSettingsImplementation();
        }
        return UserSettingsImplementation._instance;
    }


    constructor() {
        this.savePromise = null;
        this.logger = new EventLogger('UserSettings');
    }

    isInitialized(): boolean {
        return !!this.settings;
    }

    async getAll() {
        const appDir = getAppInfo().appDir;
        const fileName = `${appDir}/settings.json`;

        const exists = await RNFS.exists(fileName);

        if (exists) {
            try {
                const data = await RNFS.readFile(fileName);

                const settings = JSON.parse(data);
                this.settings = { 
                    ...settings,
                    ...defSettings
                }

                return this.settings;
            } catch (e) {
                this.logError(e as Error, 'getAll');
            }
        } else {
            this.settings= {...defSettings}
            await this.save(this.settings as object);
            return this.settings;
        }
    }

    get(key: string, defValue: any) {

        if (!this.settings) {
            console.warn('Trying to access settings before initialization');
            this.getAll();
        }

        const retVal = (v: any) => (v ? JSON.parse(JSON.stringify(v)) : v);

        const keys = key.split('.');
        const settings: any = this.settings ?? {};

        if (keys.length < 2) {return settings[key] || defValue;}

        let child: any = {};
        for (let index = 0; index < keys.length; index++) {
            const k = keys[index];

            if (index === keys.length - 1) {return retVal(child[k] || defValue);}
            else {
                child = index === 0 ? settings[k] : child[k];
                if (child === undefined) {
                    return retVal(defValue);
                }
            }
        }
    }

    getValue(key: string, defValue: any) { 
        try {
            return this.get(key,defValue)
        }
        catch {
            return defValue
        }
    }

    canOverwrite(): boolean {
        return true
    }

    async set(key:string,value:any): Promise<boolean> {       
        if ( key===undefined || key===null || key==='') {
            return false
        }

        this.settings = this.settings??{}

        const keys = key.split('.');
        if (keys.length<2) {
            this.settings[key] =value
            return true;
        }
    
        let child:any = {}
        for (let index=0;index<keys.length;index++) {
            const k = keys[index];

    
            if (index===keys.length-1) {
                child[k] = value;
                return true;
            }
            else { 
                const prev = index===0? this.settings : child
                child = index===0? this.settings[k] : child[k]
                if ( child===undefined) {
                    prev[k] = child = {}                    
                }   
            }
        
        }
        return false
    }



    async update(update: object = {}) {
        const settings = this.settings ? {...this.settings, ...update} : update;
        await this.save(settings);
    }

    async save(settings: object) {
        const appDir = getAppInfo().appDir;
        const fileName = `${appDir}/settings.json`;

        if (this.savePromise) {
            await this.savePromise;
        }

        let success = false;
        try {
            this.savePromise = RNFS.writeFile(
                fileName,
                JSON.stringify(settings, null, 2)
            );
            await this.savePromise;
            success = true;
        } catch (e) {
            this.logError(e, 'save');
        }
        this.savePromise = null;
        return success;
    }

    protected logError (err:any, fn:string) {
        this.logger.logEvent({message:'error',fn,error:err.message, stack:err.stack})

    }

}

export const getUserSettingsBinding = () => UserSettingsImplementation.getInstance();
