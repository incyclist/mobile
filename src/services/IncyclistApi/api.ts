// allow to set global headers to be used in all fetch requests (across objects)
// ApiConfiguraton class (Singleton) to manage base URL and headers

export class ApiConfiguration {
    private static instance: ApiConfiguration;
    private domain: string;
    private headers: {[key: string]: string};

    private constructor() {
        this.domain = '';
        this.headers = {};
    }

    public static getInstance(): ApiConfiguration {
        if (!ApiConfiguration.instance) {
            ApiConfiguration.instance = new ApiConfiguration();
        }
        return ApiConfiguration.instance;
    }

    public setDomain(baseUrl: string): void {
        this.domain = baseUrl;
    }

    public setHeaders(headers: {[key: string]: string}): void {
        this.headers = headers;
    }

    public addHeader(key: string, value: string): void {
        this.headers[key] = value;
    }

    public getDomain(): string {
        return this.domain;
    }

    public getHeaders(): {[key: string]: string} {
        return this.headers;
    }
}

export class ApiClient {
    private baseUrl: string;
    private apiPrefix: string;
    private url:string|undefined

    constructor(baseUrl?: string, isCompleteUrl = false) {
        this.baseUrl = 'dlws';
        this.apiPrefix = '';
        if (baseUrl) {
            this.setBaseUrl(baseUrl, isCompleteUrl);
        }
    }

    public setUrl(url:string) {
        this.url = url
    }
    public setBaseUrl(baseUrl: string, isCompleteUrl = false): void {
        this.baseUrl = isCompleteUrl ? baseUrl : `${baseUrl}.${this.domain}`;
    }

    public useApiVersion(version: string | number): void {
        if (typeof version === 'number') {
            this.apiPrefix = `/api/v${version.toString()}`;
        } else {
            this.apiPrefix = `/api/${version}`;
        }
    }

    public getUrl(endpoint: string): string {
        return this.url ? `${this.url}${endpoint}` : `https://${this.baseUrl}${this.apiPrefix}${endpoint}`;
    }

    async get<T>(
        endpoint: string,
        headers?: {[key: string]: string}
    ): Promise<T> {
        const response = await fetch(this.getUrl(endpoint), {
            headers: this.mergeHeaders(headers),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async post<T>(
        endpoint: string,
        data: any,
        headers?: {[key: string]: string}
    ): Promise<T> {
        const requestHeaders = this.mergeHeaders(headers) ?? {};
        requestHeaders['Content-Type'] = 'application/json';

        const response = await fetch(this.getUrl(endpoint), {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    protected get domain(): string {
        return ApiConfiguration.getInstance().getDomain();
    }

    protected get headers() {
        return ApiConfiguration.getInstance().getHeaders();
    }

    protected mergeHeaders(headers?: {[key: string]: string}): {
        [key: string]: string;
    } {
        if (!headers) {
            return this.headers;
        }

        return {
            ...this.headers,
            ...headers,
        };
    }
}
