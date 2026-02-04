export interface TPayload {
    command: string;
    key: string;
}

export type HandlerDefinition<T> = {
    onMessage: (payload: T) => void;
};

export interface TFeature {
    register(): void;
}

export class BaseFeature {
    constructor(protected integration: IWebViewIntegration) {}
    register() {
        throw new Error('method not implemented');
    }
}

export interface IWebViewIntegration {
    addHandler(command: string, handler: HandlerDefinition<any>): void;
    sendMessage(key: string, payload: object | string): void;
}
