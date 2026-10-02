import { EventLogger } from 'gd-eventlog';
import { FileInfo } from 'incyclist-services'
import RNFS from 'react-native-fs';

/**
 * Converts a file picker result (after keepLocalCopy) into a FileInfo
 * object ready for service consumption.
 *
 * @param localPath full local path, WITHOUT file:// prefix
 * @param fileName original filename e.g. "FR_Col-de-Pennes.xml"
 * @returns A FileInfo object
 */
export const buildFileInfo = (
    localPath: string,
    fileName: string
): FileInfo => {
    const delimiter = '/'
    const ext = fileName.split('.').pop() ?? ''
    const name = ext ? fileName.slice(0, -(ext.length + 1)) : fileName
    const dir = localPath.slice(0, localPath.lastIndexOf(delimiter) + 1)

    return {
        type: 'file',
        name,        
        base: fileName,
        filename: localPath,
        dir,
        ext,
        delimiter,
    }
}

export const deleteIfExisting = async ( path:string):Promise<void> =>{ 
    try {
        const isExisting = await RNFS.exists(path)
        if (!isExisting)
            return
        await RNFS.unlink(path)
    }
    catch (err: any) {
        const logger = new EventLogger('Incyclist')
        logger.logEvent({message:'error', fn:'deleteIfExisting', error:err.mesage, stack:err.stack})
    }

}