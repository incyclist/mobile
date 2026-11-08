import { probeVideoSource, PROBE_TIMEOUT_MS } from './probeVideoSource';

class FakeXhr {
    static last: FakeXhr;

    readyState = 0;
    status = 0;
    responseURL = '';
    headers: Record<string, string> = {};
    onreadystatechange?: () => void;
    onerror?: () => void;
    open = jest.fn();
    setRequestHeader = jest.fn();
    send = jest.fn();
    abort = jest.fn();

    constructor() {
        FakeXhr.last = this;
    }

    getResponseHeader(name: string) {
        return this.headers[name] ?? null;
    }

    respond(state: number, status: number, headers: Record<string, string>, responseURL = '') {
        this.readyState = state;
        this.status = status;
        this.headers = headers;
        this.responseURL = responseURL;
        this.onreadystatechange?.();
    }
}

describe('probeVideoSource', () => {
    const original = global.XMLHttpRequest;

    beforeEach(() => {
        jest.useFakeTimers();
        (global as any).XMLHttpRequest = FakeXhr;
    });

    afterEach(() => {
        jest.useRealTimers();
        global.XMLHttpRequest = original;
    });

    test('sends the 2 byte range request the player sends first', () => {
        probeVideoSource('https://example.com/a.mp4');

        expect(FakeXhr.last.open).toHaveBeenCalledWith('GET', 'https://example.com/a.mp4');
        expect(FakeXhr.last.setRequestHeader).toHaveBeenCalledWith('Range', 'bytes=0-1');
    });

    test('reports status and headers as soon as the headers are there, and stops the transfer', async () => {
        const result = probeVideoSource('https://example.com/a.mp4');
        FakeXhr.last.respond(2, 206, { 'content-range': 'bytes 0-1/100', 'cf-ray': 'abc-DUS', 'cf-cache-status': 'BYPASS' }, 'https://cdn.example.com/a.mp4');

        await expect(result).resolves.toEqual(expect.objectContaining({
            status: 206,
            contentRange: 'bytes 0-1/100',
            cfRay: 'abc-DUS',
            cfCacheStatus: 'BYPASS',
            finalUrl: 'https://cdn.example.com/a.mp4',
        }));
        expect(FakeXhr.last.abort).toHaveBeenCalled();
    });

    test('reports a plain 200 (range ignored)', async () => {
        const result = probeVideoSource('https://example.com/a.mp4');
        FakeXhr.last.respond(2, 200, { 'content-length': '2508217062' });

        await expect(result).resolves.toEqual(expect.objectContaining({ status: 200, contentLength: '2508217062' }));
    });

    test('reports a network error', async () => {
        const result = probeVideoSource('https://example.com/a.mp4');
        FakeXhr.last.onerror?.();

        await expect(result).resolves.toEqual(expect.objectContaining({ error: 'network error' }));
    });

    test('reports a timeout', async () => {
        const result = probeVideoSource('https://example.com/a.mp4');
        jest.advanceTimersByTime(PROBE_TIMEOUT_MS);

        await expect(result).resolves.toEqual(expect.objectContaining({ error: 'timeout' }));
        expect(FakeXhr.last.abort).toHaveBeenCalled();
    });

    test('settles only once', async () => {
        const result = probeVideoSource('https://example.com/a.mp4');
        FakeXhr.last.respond(2, 206, {});
        FakeXhr.last.respond(4, 0, {});
        jest.advanceTimersByTime(PROBE_TIMEOUT_MS);

        await expect(result).resolves.toEqual(expect.objectContaining({ status: 206 }));
    });
});
