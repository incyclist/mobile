import { pick, types, keepLocalCopy, isKnownType  } from '@react-native-documents/picker'
import { FileInfo } from 'incyclist-services'
import { useLogging } from '../logging'
import { Platform } from 'react-native'
import { buildFileInfo } from '../../utils/file'

// Module-level re-entrancy guard to prevent concurrent pick() calls
let inFlightPick = false

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

        // Guard against concurrent pick() calls from rapid user input (e.g., double-tap)
        if (inFlightPick) {
            logEvent({ message:'file picker already in progress, ignoring duplicate call' })
            return null
        }

        inFlightPick = true

        try {
            logEvent({ message:'file picker shown', props:pickProps })
            const {extensions} = pickProps??{}

  
            const props:any = {
                type: [types.allFiles],
                allowMultiSelection: false,
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

            if (!result) {
                logEvent({ message:'file picker returned no result' })
                return null;
            }
            // The picker's metadata query (name/size/type) and the actual file copy below are
            // separate native operations. The metadata query intermittently fails (empty name,
            // permission-flavored error) for files that are perfectly readable moments later via
            // keepLocalCopy - so fall back to a URI-derived name and still attempt the copy,
            // rather than giving up on a file we may well be able to read.
            let fileName = result.name
            if (!fileName) {
                fileName = decodeURIComponent(result.uri).split('/').pop() || ''
                logEvent({ message:'file picker returned no name, falling back to uri-derived name', uri: result.uri, fileName, error: result.error, nativeType: result.nativeType })
                if (!fileName) {
                    logEvent({ message:'could not derive filename from uri either, giving up', uri: result.uri })
                    return null
                }
            }

            logEvent({ message:'File picked', fileName, uri: result.uri })

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
            if (err?.code === 'DOCUMENT_PICKER_CANCELED' || err?.code === 'OPERATION_CANCELED') {
                logEvent({ message:'file picker cancelled', eventSource:'user' })
                return null
            }
            // Re-throw real errors to the caller
            throw err
        }
        finally {
            // Always reset the guard, even if an error occurs or user cancels
            inFlightPick = false
        }
    }

    return { pickFile }
}
