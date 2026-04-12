import { IFormPostBinding } from 'incyclist-services';
import RNFS from 'react-native-fs';
import { EventLogger } from 'gd-eventlog';

export class FormBinding implements IFormPostBinding {
    async createForm(opts: object, uploadInfo: object): Promise<object> {
        const logger = new EventLogger('Bindings');
        const result = { ...opts } as any;
        const formData: Record<string, any> = {};

        try {
            for (const [key, entry] of Object.entries(uploadInfo)) {
                try {
                    if (entry && typeof entry === 'object' && (entry as any).type === 'file') {
                        const path = (entry as any).fileName;
                        const base64 = await RNFS.readFile(path, 'base64');
                        const byteChars = atob(base64);
                        const uint8Array = new Uint8Array(byteChars.length);
                        for (let i = 0; i < byteChars.length; i++) {
                            uint8Array[i] = byteChars.charCodeAt(i);
                        }
                        const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
                        formData[key] = { value: blob, options: { filepath: path } };
                    } else {
                        formData[key] = entry;
                    }
                } catch (err: any) {
                    logger.logEvent({
                        message: 'createForm: error processing entry',
                        key,
                        error: err.message,
                    });
                }
            }
            result.formData = formData;
        } catch (err: any) {
            logger.logEvent({
                message: 'createForm: general error',
                error: err.message,
            });
        }
        return result;
    }

    async post(opts: object): Promise<{ data: unknown; body: string; statusCode: number }> {
        const { url, headers, formData: dataMap } = opts as any;
        const formData = new FormData();

        if (dataMap) {
            for (const [key, entry] of Object.entries(dataMap)) {
                const value = entry as any;
                if (value && typeof value === 'object' && 'value' in value && 'options' in value) {
                    const fileEntry = value as { value: Blob; options: { filepath: string } };
                    const filename = fileEntry.options.filepath.split('/').pop() || 'upload';
                    // @ts-ignore - React Native's FormData.append supports Blob
                    formData.append(key, fileEntry.value, filename);
                } else {
                    formData.append(key, String(value));
                }
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { ...headers },
            body: formData,
        });

        const body = await response.text();
        let data: any;
        try {
            data = JSON.parse(body);
        } catch {
            data = body;
        }

        if (!response.ok) {
            throw {
                response: {
                    status: response.status,
                    message: response.statusText,
                    data,
                    body,
                },
            };
        }

        return {
            data,
            body,
            statusCode: response.status,
        };
    }
}

export const getFormBinding = () => new FormBinding();