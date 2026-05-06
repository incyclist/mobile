import { pick, types, keepLocalCopy } from '@react-native-documents/picker'
import { FileInfo } from 'incyclist-services'
import { useLogging } from '../logging'
import { Platform } from 'react-native'
import { getPathBinding } from '../../bindings/path'

/**
 * @interface UseFilePickerResult
 * @property {() => Promise<FileInfo | null>} pickFile - Function to open the file picker. Returns FileInfo on success, or null if the user cancelled.
 */
export interface UseFilePickerResult {
    pickFile: () => Promise<FileInfo | null>
}

/**
 * @hook useFilePicker
 * @returns {UseFilePickerResult} A hook providing functionality to pick a single file and store a local copy.
 * Encapsulates the @react-native-documents/picker pick + keepLocalCopy flow.
 */
export const useFilePicker = (): UseFilePickerResult => {

    const {logEvent} = useLogging('Incyclist')

    const pickFile = async (): Promise<FileInfo | null> => {

        if (Platform.OS==='web')
            return null

        try {
            const [result] = await pick({
                type: [types.allFiles],
                allowMultiSelection: false,
                mode:'open',
                rrequestLongTermAccess: true
            })

            if (!result.name)
                return null;

            // const info = getPathBinding().parse(result.name)
            // return buildFileInfo(result.name,info.base)
            const fileName = result.name

            if (Platform.OS === 'ios') {
                const cleaned = decodeURIComponent(result.uri);
                const fileInfo = getPathBinding().parse(cleaned) as unknown as FileInfo
                fileInfo.base = fileName
                logEvent({ message:'File picked', fileName, uri: cleaned })  
                return fileInfo
            }
            else {
                logEvent({ message:'File picked', fileName, uri: result.uri })  
            }

            const [localCopy] = await keepLocalCopy({
                files: [{ uri: result.uri, fileName: fileName }],
                destination: 'cachesDirectory',
            })
            logEvent({ message:'Local copy result', localCopy })

            // FIX: Discriminate LocalCopyResponse based on status
            if (localCopy.status === 'success') {
                // Remove 'file://' prefix from local URI
                const localPath = localCopy.localUri.replace('file://', '')
                const fileInfo = getPathBinding().parse(localPath) as unknown as FileInfo
                fileInfo.base = fileName
                return fileInfo
            } else {
                // If the local copy failed, log the error and return null.
                // This means we couldn't get a usable local file, so the operation is not successful.
                logEvent( {message:'Failed to create local copy of the file:', reason:localCopy.copyError})
                return null
            }
        }
        catch (err: any) {
            // User cancelled the document picker — this is not an error
            if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
                return null
            }
            // Re-throw real errors to the caller
            throw err
        }
    }

    return { pickFile }
}
