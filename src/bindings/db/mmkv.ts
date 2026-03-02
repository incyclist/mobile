import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { AbstractJsonRepositoryBinding } from 'incyclist-services';
import type { JsonAccess, JSONObject } from 'incyclist-services';
import { sleep  } from '../../utils/timers';

class MmkvJsonAccessImplementation implements JsonAccess {
    private storage: MMKV;

    constructor(name: string) {


        this.storage = createMMKV({ id: `db_${name}` });
    }

    async read(resourceName: string): Promise<JSONObject> {

        try {
            const dataStr = this.storage.getString(resourceName);
            await sleep(0)
            if (!dataStr) return {} as JSONObject;

            const data = JSON.parse(dataStr);
            return data;
        } catch {
            return {} as JSONObject;
        }
    }

    async write(resourceName: string, data: JSONObject): Promise<boolean> {
        try {
            const dataStr = JSON.stringify(data);
            this.storage.set(resourceName, dataStr);
            await sleep(0)
            return true;
        } catch {
            return false;
        }
    }

    async delete(resourceName: string): Promise<boolean> {
        try {            
            const res = this.storage.remove(resourceName);
            await new Promise(resolve => setTimeout(resolve, 0));
            return res
        } catch {
            return false;
        }
    }

    async list(): Promise<Array<string>> {
        try {
            // Use built-in getAllKeys() and filter out any potential internal keys
            const data = this.storage.getAllKeys().filter(k => k !== '__index__');
            return data
        } catch {
            return [];
        }
    }
}

export class MmkvJsonRepositoryBinding extends AbstractJsonRepositoryBinding {
    private instances: Map<string, JsonAccess> = new Map();

    async create(name: string): Promise<JsonAccess | null> {
        const access = new MmkvJsonAccessImplementation(name);
        this.instances.set(name, access);
        return access;
    }

    async get(name: string): Promise<JsonAccess | null> {
        const existing = this.instances.get(name);
        if (existing) return existing;
        return await this.create(name);
    }

    async release(name: string): Promise<boolean> {
        return this.instances.delete(name);
    }

    getPath(name: string): string {
        return `mmkv://db_${name}`;
    }
}

export const getMmkvRepositoryBinding = () => new MmkvJsonRepositoryBinding();
