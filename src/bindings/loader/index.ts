import RNFS from 'react-native-fs';
import { IFileLoader, FileInfo, FileLoaderResult } from 'incyclist-services';

export class FileLoaderBinding implements IFileLoader {
    async open(file: FileInfo): Promise<FileLoaderResult> {
        try {
            let data: any;
            if (file.type === 'file') {
                const path = file.filename || `${file.dir}/${file.name}${file.ext}`;
                data = await RNFS.readFile(path, file.encoding || 'utf8');
            } else if (file.type === 'url' && file.url) {
                const response = await fetch(file.url);
                data = await response.text();
            }
            return { data };
        } catch (err: any) {
            return { error: { message: err.message, key: 'LOAD_FAILED' } };
        }
    }
}

export const getFileLoaderBinding = () => new FileLoaderBinding();