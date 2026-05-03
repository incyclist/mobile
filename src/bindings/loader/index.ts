import RNFS from 'react-native-fs';
import { IFileLoader, FileInfo, FileLoaderResult } from 'incyclist-services';
import { TurboModuleRegistry, TurboModule } from 'react-native';

// Define the interface for SAF native module
interface SAFSpec extends TurboModule {
    listFiles(uri: string): Promise<Array<{ name: string; uri: string; isDirectory: boolean }>>
    exists(uri: string): Promise<boolean>
    readFile(uri: string, encoding: string): Promise<string>
}

const SAF = TurboModuleRegistry.getEnforcing<SAFSpec>('SAF');

export class FileLoaderBinding implements IFileLoader {
    async open(file: FileInfo): Promise<FileLoaderResult> {
        try {
            let data: any

            const readFileWithEncoding = async (path: string, encoding?: string): Promise<string|Buffer> => {
                const readRaw = async (enc: string): Promise<string> => {
                    return path.startsWith('content://')
                        ? await SAF.readFile(path, enc)
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