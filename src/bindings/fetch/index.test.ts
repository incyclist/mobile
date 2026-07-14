import { FetchBinding } from './index';

describe('FetchBinding', () => {
    let binding: FetchBinding;
    const originalFetch = global.fetch;

    beforeEach(() => {
        binding = new FetchBinding();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    const mockFetchResponse = (props: { ok?: boolean; status?: number; statusText?: string; headers?: [string, string][]; text?: string }) => {
        const headers = new Map(props.headers ?? []);
        global.fetch = jest.fn().mockResolvedValue({
            ok: props.ok ?? true,
            status: props.status ?? 200,
            statusText: props.statusText ?? 'OK',
            headers: { forEach: (cb: (value: string, key: string) => void) => headers.forEach((v, k) => cb(v, k)) },
            text: jest.fn().mockResolvedValue(props.text ?? ''),
        });
    };

    test('issues a GET by default and maps the response', async () => {
        mockFetchResponse({ status: 200, statusText: 'OK', headers: [['content-type', 'application/json']], text: '{"a":1}' });

        const res = await binding.fetch('https://overpass.example/api/interpreter');

        expect(global.fetch).toHaveBeenCalledWith('https://overpass.example/api/interpreter', {
            method: 'GET',
            headers: undefined,
            body: undefined,
        });
        expect(res).toEqual({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            data: '{"a":1}',
        });
    });

    test('passes method, headers and body through to fetch', async () => {
        mockFetchResponse({ ok: false, status: 400, statusText: 'Bad Request' });

        const res = await binding.fetch('https://overpass.example/api/interpreter', {
            method: 'POST',
            headers: { 'User-Agent': 'Incyclist/1.0', Referer: 'https://incyclist.com' },
            body: 'query-data',
        });

        expect(global.fetch).toHaveBeenCalledWith('https://overpass.example/api/interpreter', {
            method: 'POST',
            headers: { 'User-Agent': 'Incyclist/1.0', Referer: 'https://incyclist.com' },
            body: 'query-data',
        });
        expect(res.ok).toBe(false);
        expect(res.status).toBe(400);
    });

    test('rejects when fetch itself rejects', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

        await expect(binding.fetch('https://overpass.example/api/interpreter')).rejects.toThrow('network down');
    });
});
