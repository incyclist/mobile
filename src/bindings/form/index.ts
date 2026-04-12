import { IFormPostBinding } from 'incyclist-services';
import { EventLogger } from 'gd-eventlog';
import RNFS from 'react-native-fs';

export class FormBinding implements IFormPostBinding {
    private logger: EventLogger;

    constructor() {
        this.logger = new EventLogger('Bindings');
    }

    async createForm(opts: object, uploadInfo: object): Promise<object> {
        const result = { ...opts } as any;
        const formData: Record<string, any> = {};

        try {
            for (const [key, entry] of Object.entries(uploadInfo)) {
                try {
                    if (entry && typeof entry === 'object' && (entry as any).type === 'file') {
                        const path = (entry as any).fileName;

                        if (!path) {
                            this.logger.logEvent({
                                message: 'createForm: missing fileName for file entry',
                                key,
                            });
                            continue;
                        }

                        const base64 = await RNFS.readFile(path, 'base64');
                        const dataUri = `data:application/octet-stream;base64,${base64}`;

                        formData[key] = {
                            value: {
                                uri: dataUri,
                                type: 'application/octet-stream',
                                name: path.split('/').pop() || 'upload',
                            },
                            options: { filepath: path },
                        };
                    } else {
                        formData[key] = entry;
                    }
                } catch (err: any) {
                    this.logger.logEvent({
                        message: 'createForm: error processing entry',
                        key,
                        error: err.message,
                    });
                }
            }
            result.formData = formData;
        } catch (err: any) {
            this.logger.logEvent({
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
                    const fileEntry = value as { value: any; options: { filepath: string } };
                    formData.append(key, fileEntry.value as any);
                } else {
                    formData.append(key, String(value));
                }
            }
        }

        this.logger.logEvent({ message: 'posting form', url, headers, formData });

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
