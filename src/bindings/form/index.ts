import { IFormPostBinding } from 'incyclist-services';
import RNFS from 'react-native-fs';
import { EventLogger } from 'gd-eventlog';

export class FormBinding implements IFormPostBinding {
    private logger: EventLogger;

    constructor() {
        this.logger = new EventLogger('Bindings');
    }

    async createForm(opts: any, uploadInfo: any): Promise<any> {
        const formData: Record<string, any> = {};

        for (const [key, info] of Object.entries(uploadInfo)) {
            try {
                if (info && typeof info === 'object' && (info as any).type === 'file') {
                    const fileName = (info as any).fileName;
                    if (fileName) {
                        const base64 = await RNFS.readFile(fileName, 'base64');
                        
                        // Convert base64 to Blob as per reference pattern
                        const byteChars = atob(base64);
                        const uint8 = new Uint8Array(byteChars.length);
                        for (let i = 0; i < byteChars.length; i++) {
                            uint8[i] = byteChars.charCodeAt(i);
                        }
                        const blob = new Blob([uint8], { type: 'application/octet-stream' });
                        
                        formData[key] = { value: blob, options: { filepath: fileName } };
                    }
                } else {
                    formData[key] = info;
                }
            } catch (err: any) {
                this.logger.logEvent({ 
                    message: 'Error creating form entry', 
                    key, 
                    error: err.message 
                });
            }
        }

        return { ...opts, formData };
    }

    async post(opts: any): Promise<{ data: unknown; body: string; statusCode: number }> {
        const { url, headers, formData } = opts;
        const form = new FormData();

        if (formData) {
            for (const [key, entry] of Object.entries(formData)) {
                if (entry && typeof entry === 'object' && (entry as any).value && (entry as any).options) {
                    const { value, options } = entry as any;
                    const filename = options.filepath ? options.filepath.split('/').pop() : 'file';
                    // React Native FormData expects (key, value, filename) for files
                    form.append(key, value as any, filename);
                } else {
                    form.append(key, String(entry));
                }
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { ...headers },
            body: form as any,
        });

        const text = await response.text();
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = text;
        }

        if (!response.ok) {
            throw {
                response: {
                    status: response.status,
                    message: response.statusText || 'Request failed',
                    data: parsed,
                    body: JSON.stringify(parsed),
                }
            };
        }

        return {
            data: parsed,
            body: text,
            statusCode: response.status,
        };
    }
}