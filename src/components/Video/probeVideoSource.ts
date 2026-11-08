// Diagnostic only. When the native player rejects a remote video, repeat the request it makes
// first (a 2 byte range request) from JS and report what the server answered, so that a failure
// can be told apart in the logs: wrong status, missing Content-Range, redirect target, edge
// location, or no answer at all.
//
// Uses XMLHttpRequest instead of fetch: it lets us stop as soon as the response headers are
// there. A server that ignores the Range header would otherwise make us download the whole file.

export const PROBE_TIMEOUT_MS = 8000;

const HEADERS_RECEIVED = 2;
const DONE = 4;

export interface VideoProbeResult {
    elapsedMs: number;
    status?: number;
    contentRange?: string;
    contentLength?: string;
    acceptRanges?: string;
    finalUrl?: string;
    server?: string;
    cfRay?: string;
    cfCacheStatus?: string;
    error?: string;
}

const readHeader = (xhr: XMLHttpRequest, name: string): string | undefined => {
    return xhr.getResponseHeader(name) ?? undefined;
};

const describeResponse = (xhr: XMLHttpRequest): Omit<VideoProbeResult, 'elapsedMs'> => ({
    status: xhr.status,
    contentRange: readHeader(xhr, 'content-range'),
    contentLength: readHeader(xhr, 'content-length'),
    acceptRanges: readHeader(xhr, 'accept-ranges'),
    finalUrl: xhr.responseURL || undefined,
    server: readHeader(xhr, 'server'),
    cfRay: readHeader(xhr, 'cf-ray'),
    cfCacheStatus: readHeader(xhr, 'cf-cache-status'),
});

export const probeVideoSource = (url: string, timeoutMs: number = PROBE_TIMEOUT_MS): Promise<VideoProbeResult> => {
    return new Promise<VideoProbeResult>((resolve) => {
        const start = Date.now();
        const xhr = new XMLHttpRequest();
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const finish = (details: Omit<VideoProbeResult, 'elapsedMs'>) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            resolve({ elapsedMs: Date.now() - start, ...details });
            xhr.abort();
        };

        timer = setTimeout(() => finish({ error: 'timeout' }), timeoutMs);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === HEADERS_RECEIVED || xhr.readyState === DONE) {
                finish(describeResponse(xhr));
            }
        };
        xhr.onerror = () => finish({ error: 'network error' });

        try {
            xhr.open('GET', url);
            xhr.setRequestHeader('Range', 'bytes=0-1');
            xhr.send();
        }
        catch (err) {
            finish({ error: err instanceof Error ? err.message : 'probe failed' });
        }
    });
};
