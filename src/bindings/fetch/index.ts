import type { IFetchBinding, IFetchRequestInit, IFetchResponse } from 'incyclist-services';

/**
 * React Native's fetch is backed by native networking (OkHttp/NSURLSession), not a
 * browser engine, so it does not enforce the forbidden-header/referrer-policy rules
 * that block setting Referer/User-Agent from a page - see the desktop binding
 * (mobile/../desktop/src/features/fetch/feature.js) for why that binding is needed there.
 */
export class FetchBinding implements IFetchBinding {
    async fetch(url: string, init?: IFetchRequestInit): Promise<IFetchResponse> {
        const response = await fetch(url, {
            method: init?.method ?? 'GET',
            headers: init?.headers,
            body: init?.body,
        });

        const data = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => { headers[key] = value });

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers,
            data,
        };
    }
}

export const getFetchBinding = () => new FetchBinding();
