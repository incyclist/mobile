/**
 * Percent-encodes a URI exactly once, regardless of whether it arrives already
 * encoded or not.
 *
 * `services`' URL builders (`buildFileUrl()`/`buildVideoUrl()`/`handleFileUrlPath()`
 * in incyclist-services, src/routes/base/parsers/utils.ts) already call `encodeURI()`
 * on locally-discovered file paths. Some other sources reaching this component
 * (e.g. `FileSystemBinding.listLocalEntries()`'s raw `file://${path}` from
 * `RNFS.readDir()`) do not. Calling `encodeURI()` unconditionally on an
 * already-encoded string double-encodes it - `%` is not in `encodeURI`'s safe set,
 * so an existing `%20` becomes `%2520`, pointing AVPlayer at a path that doesn't
 * exist. Decoding first collapses any existing percent-encoding back to raw
 * characters before re-encoding once, making the result the same whether the
 * input was raw or already encoded.
 */
export const encodeUriIdempotent = (uri: string): string => {
    if (!uri) {
        return uri;
    }

    try {
        return encodeURI(decodeURI(uri));
    } catch {
        // malformed percent-sequence - not actually pre-encoded, encode as raw
        return encodeURI(uri);
    }
};
