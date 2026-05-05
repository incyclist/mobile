import RNFS from 'react-native-fs';
import { IFileLoader, FileInfo, FileLoaderResult } from 'incyclist-services';
import FolderAccess from '../../specs/NativeFolderAccess';

const requireFolderAccess = () => {
    if (!FolderAccess) {
        throw new Error('FolderAccess native module is not available on this platform');
    }
    return FolderAccess;
};

export class FileLoaderBinding implements IFileLoader {
    async open(file: FileInfo): Promise<FileLoaderResult> {
        try {
            let data: any

            const readFileWithEncoding = async (path: string, encoding?: string): Promise<string|Buffer> => {
                const readRaw = async (enc: string): Promise<string> => {
                    return path.startsWith('content://')
                        ? await requireFolderAccess().readFile(path, enc)
                        : await RNFS.readFile(path, enc)
                }

                if (encoding === 'base64') {
                    return readRaw('base64')
                }
                if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
                    const base64 = await readRaw('base64')

                    const buffer = Buffer.from(base64, 'base64')
                    if (encoding==='binary')
                         return buffer
                    return buffer.toString(encoding as BufferEncoding)

                }
                return readRaw('utf8')
            }

            if (file.type === 'file') {
                const path = file.filename || `${file.dir}${file.delimiter ?? '/'}${file.name}.${file.ext}`
                data = await readFileWithEncoding(path, file.encoding)
            } else if (file.type === 'url' && file.url) {
                const response = await fetch(file.url)
                data = await response.text()
            }
            return { data }
        } catch (err: any) {
            return { error: { message: err.message, key: 'LOAD_FAILED' } }
        }
    }
}

export const getFileLoaderBinding = () => new FileLoaderBinding();
