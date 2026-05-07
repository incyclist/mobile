import { IFileLoader, FileInfo, FileLoaderResult } from 'incyclist-services';
import FolderAccess from '../../specs/NativeFolderAccess';
import { EventLogger } from 'gd-eventlog';
import { getFileSystemBinding } from '../fs';
import { Platform } from 'react-native';

const requireFolderAccess = () => {
    if (!FolderAccess) {
        throw new Error('FolderAccess native module is not available on this platform');
    }
    return FolderAccess;
};

export class FileLoaderBinding implements IFileLoader {

    protected logger = new EventLogger('FileLoader')

    async open(file: FileInfo): Promise<FileLoaderResult> {

        this.logger.logEvent({mesage:'open', file})

        try {
            let data: any

            const readFileWithEncoding = async (path: string, encoding?: string): Promise<string|Buffer> => {
                const readRaw = async (enc: string): Promise<string> => {
                    return path.startsWith('content://')
                        ? await requireFolderAccess().readFile(path, enc)
                        : await getFileSystemBinding().readFile(path,enc) as string
                }

                if (encoding==='binary' && !path.startsWith('content://')) {
                    return await getFileSystemBinding().readFile(path,encoding)
                }

                if (encoding === 'base64') {
                    return readRaw('base64')
                }
                if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
                    const base64 = await readRaw('base64')

                    const buffer = Buffer.from(base64, 'base64')
                    return buffer.toString(encoding as BufferEncoding)

                }
                return readRaw('utf8')
            }

            if (file.type === 'file' || !file.type ) {
                let path = file.filename ?? `${file.dir}${file.delimiter ?? '/'}${file.name}.${file.ext}`

                if (Platform.OS==='ios' && path?.startsWith('/')) {
                    path = `file://${path}`
                }
                data = await readFileWithEncoding(path, file.encoding)
            } else if (file.type === 'url' && file.url) {
                const response = await fetch(file.url)
                data = await response.text()
            }
            return { data }
        } catch (err: any) {
            this.logger.logEvent({mesage:'open failed', file,reason:err.message??err})
            return { error: { message: err.message, key: 'LOAD_FAILED' } }
        }
    }
}

export const getFileLoaderBinding = () => new FileLoaderBinding();
