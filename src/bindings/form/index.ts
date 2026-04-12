import { IFormPostBinding } from 'incyclist-services';
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
                        // For React Native, we use the file URI approach for FormData.
                        // This avoids loading the entire file into memory as a Blob/Base64.
                        formData[key] = {
                            value: {
                                uri: fileName.startsWith('file://') ? fileName : `file://${fileName}`,
                                name: fileName.split('/').pop() || 'file',
                                type: 'application/octet-stream'
                            },
                            options: { filepath: fileName }
                        };
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
                    // React Native FormData handles file objects with uri, name, type
                    // The 'as any' is required as RN's FormData type definition is sometimes incomplete
                    form.append(key, (entry as any).value as any);
                } else {
                    form.append(key, String(entry));
                }
            }
        }

        const fetchHeaders: Record<string, string> = { ...headers };
        // Remove Content-Type to allow fetch to set the multipart boundary automatically
        Object.keys(fetchHeaders).forEach(k => {
            if (k.toLowerCase() === 'content-type') {
                delete fetchHeaders[k];
            }
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: fetchHeaders,
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
            // Throwing standardized error response shape
            throw {
                response: {
                    status: response.status,
                    statusText: response.statusText || 'Request failed',
                    data: parsed,
                    body: text,
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

export const getFormBinding = () => new FormBinding();