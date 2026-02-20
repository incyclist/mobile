import RNFS from 'react-native-fs';
import { IFileSystem } from 'incyclist-services';

export class FileSystemBinding implements IFileSystem {
    async writeFile(path: string, data: any, encoding?: string): Promise<void> {
        return await RNFS.writeFile(path, data, encoding);
    }

    async readFile(path: string, encoding?: string): Promise<string> {
        return await RNFS.readFile(path, encoding);
    }

    async appendFile(path: string, data: string, encoding?: string): Promise<void> {
        return await RNFS.appendFile(path, data, encoding);
    }

    async deleteFile(path: string): Promise<void> {
        return await RNFS.unlink(path);
    }

    async unlink(path: string): Promise<void> {
        return await RNFS.unlink(path);
    }

    // Streams are handled differently in RN, providing basic wrappers
    createWriteStream(path: string, encoding?: string) {
        return {
            write: async (data: string) => await RNFS.appendFile(path, data, encoding),
            end: () => Promise.resolve()
        };
    }

    createReadStream(path: string, encoding?: string) {
        return {
            read: async () => await RNFS.readFile(path, encoding)
        };
    }

    async access(path: string, _mode?: number): Promise<void> {
        const exists = await RNFS.exists(path);
        if (!exists) {
            throw new Error(`Path does not exist: ${path}`);
        }
    }

    async existsFile(path: string): Promise<boolean> {
        return await RNFS.exists(path);
    }

    async existsDir(path: string): Promise<boolean> {
        return await RNFS.exists(path);
    }

    async mkdir(path: string): Promise<void> {
        return await RNFS.mkdir(path);
    }

    async ensureDir(path: string): Promise<void> {
        const exists = await RNFS.exists(path);
        if (!exists) {
            await RNFS.mkdir(path);
        }
    }

    async readdir ( path: string, options?: any): Promise<string[]> {
        if (options) {
            // TODO: options.recursive
        }

        const res = await RNFS.readdir(path);
        return res;
    };    
    }

export const getFileSystemBinding = () => new FileSystemBinding();