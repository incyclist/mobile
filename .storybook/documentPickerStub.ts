/**
 * Storybook stub for @react-native-documents/picker.
 *
 * This is a native-only module (uses TurboModuleRegistry) with no web
 * equivalent. Stories never invoke file picking, so no-op implementations
 * satisfy the import and let the module graph resolve without crashing.
 */

export const pick = async (_options?: any): Promise<any[]> => [];

export const keepLocalCopy = async (_options?: any): Promise<any[]> => [];

export const types: Record<string, string> = {
    allFiles: '*/*',
    audio:    'audio/*',
    csv:      'text/csv',
    doc:      'application/msword',
    docx:     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    images:   'image/*',
    pdf:      'application/pdf',
    plainText:'text/plain',
    ppt:      'application/vnd.ms-powerpoint',
    pptx:     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    video:    'video/*',
    xls:      'application/vnd.ms-excel',
    xlsx:     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip:      'application/zip',
};

export default { pick, keepLocalCopy, types };