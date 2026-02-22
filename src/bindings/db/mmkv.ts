import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { AbstractJsonRepositoryBinding } from 'incyclist-services';
import type { JsonAccess, JSONObject } from 'incyclist-services';

class MmkvJsonAccessImplementation implements JsonAccess {
    private storage: MMKV;

    constructor(name: string) {
        this.storage = createMMKV({ id: `db_${name}` });
    }

    async read(resourceName: string): Promise<JSONObject> {
        console.log(new Date().toISOString(), '# [MMKV] DB.read', resourceName);

        const dataStr = this.storage.getString(resourceName);
        console.log(new Date().toISOString(), '# [MMKV] DB.read done', resourceName);

        if (!dataStr) return {} as JSONObject;

        try {
            console.log(new Date().toISOString(), '# [MMKV] DB.parse', resourceName);
            const data = JSON.parse(dataStr);
            console.log(new Date().toISOString(), '# [MMKV] DB.parse done', resourceName);
            return data;
        } catch {
            return {} as JSONObject;
        }
    }

    async write(resourceName: string, data: JSONObject): Promise<boolean> {
        try {
            const dataStr = JSON.stringify(data);
            this.storage.set(resourceName, dataStr);
            return true;
        } catch {
            return false;
        }
    }

    async delete(resourceName: string): Promise<boolean> {
        try {
            // Using remove() as per v3 Nitro API requirements
            return this.storage.remove(resourceName);
        } catch {
            return false;
        }
    }

    async list(): Promise<Array<string>> {
        try {
            // Use built-in getAllKeys() and filter out any potential internal keys
            return this.storage.getAllKeys().filter(k => k !== '__index__');
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
