import RNFS from 'react-native-fs';
import { AbstractJsonRepositoryBinding } from 'incyclist-services';
import type { JsonAccess, JSONObject } from 'incyclist-services';

class JsonAccessImplementation implements JsonAccess {
    private baseDir: string;
    private cache: Map<string, JSONObject> = new Map();

    constructor(name: string) {
        this.baseDir = `${RNFS.DocumentDirectoryPath}/db/${name}`;
    }

    private getPath(resourceName: string): string {
        return `${this.baseDir}/${resourceName}.json`;
    }

    async read(resourceName: string): Promise<JSONObject> {
        // Quick access for the "db" index resource via memory cache
        if (resourceName === 'db' && this.cache.has('db')) {
            return this.cache.get('db')!;
        }

        try {
            const path = this.getPath(resourceName);
            if (!(await RNFS.exists(path))) return {} as JSONObject;
            
            const content = await RNFS.readFile(path, 'utf8');
            const data = JSON.parse(content);
            
            if (resourceName === 'db') this.cache.set('db', data);
            return data;
        } catch {
            return {} as JSONObject;
        }
    }

    async write(resourceName: string, data: JSONObject): Promise<boolean> {
        try {
            const path = this.getPath(resourceName);
            const tempPath = `${path}.tmp`;

            if (!(await RNFS.exists(this.baseDir))) await RNFS.mkdir(this.baseDir);

            // Atomic write: Write to temp then move
            await RNFS.writeFile(tempPath, JSON.stringify(data), 'utf8');
            if (await RNFS.exists(path)) await RNFS.unlink(path);
            await RNFS.moveFile(tempPath, path);

            if (resourceName === 'db') this.cache.set('db', data);
            return true;
        } catch {
            return false;
        }
    }

    async delete(resourceName: string): Promise<boolean> {
        try {
            const path = this.getPath(resourceName);
            if (await RNFS.exists(path)) await RNFS.unlink(path);
            if (resourceName === 'db') this.cache.delete('db');
            return true;
        } catch {
            return false;
        }
    }

    async list(): Promise<Array<string>> {
        try {
            if (!(await RNFS.exists(this.baseDir))) return [];
            const files = await RNFS.readDir(this.baseDir);
            return files
                .filter(f => f.isFile() && f.name.endsWith('.json'))
                .map(f => f.name.replace('.json', ''));
        } catch {
            return [];
        }
    }
}

export class JsonRepositoryBinding extends AbstractJsonRepositoryBinding {
    private instances: Map<string, JsonAccess> = new Map();

    async create(name: string): Promise<JsonAccess | null> {
        const access = new JsonAccessImplementation(name);
        this.instances.set(name, access);
        return access;
    }

    async get(name: string): Promise<JsonAccess | null> {
        return this.instances.get(name) || await this.create(name);
    }

    async release(name: string): Promise<boolean> {
        return this.instances.delete(name);
    }

    getPath(name: string): string {
        return `file://${RNFS.DocumentDirectoryPath}/db/${name}`;
    }
}

export const getRepositoryBinding = () => new JsonRepositoryBinding();