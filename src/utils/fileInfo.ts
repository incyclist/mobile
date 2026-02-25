import { FileInfo } from 'incyclist-services'

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
