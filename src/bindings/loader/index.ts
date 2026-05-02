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
            if (file.type === 'file') {
                const path = file.filename || `${file.dir}${file.delimiter ?? '/'}${file.name}.${file.ext}`
                if (path.startsWith('content://')) {
                    data = await SAF.readFile(path, file.encoding ?? 'utf8')
                } else {
                    data = await RNFS.readFile(path, file.encoding ?? 'utf8')
                }
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