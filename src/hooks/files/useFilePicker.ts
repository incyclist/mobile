import { pick, types, keepLocalCopy, isKnownType  } from '@react-native-documents/picker'
import { FileInfo } from 'incyclist-services'
import { useLogging } from '../logging'
import { Platform } from 'react-native'
import { buildFileInfo } from '../../utils/file'

export interface FilePickerProps {
    extensions?:Array<string>    
}

/**
 * @interface UseFilePickerResult
 * @property {() => Promise<FileInfo | null>} pickFile - Function to open the file picker. Returns FileInfo on success, or null if the user cancelled.
 */
export interface UseFilePickerResult {
    pickFile: ( props?:FilePickerProps) => Promise<FileInfo | null>
}

/**
 * @hook useFilePicker
 * @returns {UseFilePickerResult} A hook providing functionality to pick a single file and store a local copy.
 * Encapsulates the @react-native-documents/picker pick + keepLocalCopy flow.
 */
export const useFilePicker = (): UseFilePickerResult => {

    const {logEvent} = useLogging('Incyclist')

    const pickFile = async (pickProps?:FilePickerProps): Promise<FileInfo | null> => {

        if (Platform.OS==='web')
            return null

        try {
            logEvent({ message:'file picker shown', props:pickProps })
            const {extensions} = pickProps??{}

  
            const props:any = {
                type: [types.allFiles],
                allowMultiSelection: false,
            }
            if (Platform.OS === 'ios') {
                props.mode = 'open'
                props.requestLongTermAccess= false
            }

            if (extensions?.length) {
                props.types = []
                extensions.forEach( ext=> {
                    const { isKnown, mimeType, preferredFilenameExtension } = isKnownType({
                        kind: 'extension',
                        value: ext,
                    })
                    props.types.push({ isKnown, mimeType, preferredFilenameExtension })

                })
            }

            const [result] = await pick(props)

            if (!result.name)
                return null;

            // const info = getPathBinding().parse(result.name)
            // return buildFileInfo(result.name,info.base)
            const fileName = result.name

            if (Platform.OS === 'ios') {
                const cleaned = decodeURIComponent(result.uri).replace('file://', '');
                logEvent({ message:'File picked', fileName, uri: cleaned})  
                return  buildFileInfo(cleaned,fileName)

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
                return buildFileInfo(localPath,fileName)
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
