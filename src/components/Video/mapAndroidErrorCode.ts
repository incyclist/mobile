// W3C MediaError codes - what the shared RLVDisplayService.buildVideoError (incyclist-services)
// switches on to produce a human-readable message. Android/ExoPlayer (react-native-video) reports
// its own errorCode as the string "2" + PlaybackException's numeric code (e.g. "22004" for
// ERROR_CODE_IO_BAD_HTTP_STATUS = 2004 - see react-native-video's
// ReactExoplayerView.java#onPlayerError: `errorCode = "2" + e.errorCode`), which never matches the
// W3C 1-4 range on its own. Map ExoPlayer's documented code ranges to the closest W3C category.
const MEDIA_ERR_NETWORK = 2;
const MEDIA_ERR_DECODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

export const mapAndroidErrorCode = (rawCode: number): number | undefined => {
    if (rawCode < 20000 || rawCode >= 30000)
        return undefined;

    const exoCode = rawCode - 20000;
    if (exoCode >= 2000 && exoCode < 3000)
        return MEDIA_ERR_NETWORK;              // IO/source errors (e.g. bad HTTP status, timeouts)
    if (exoCode >= 3000 && exoCode < 4000)
        return MEDIA_ERR_SRC_NOT_SUPPORTED;    // container/manifest parsing errors
    if (exoCode >= 4000 && exoCode < 6000)
        return MEDIA_ERR_DECODE;               // decoder/renderer errors

    // general (1xxx) and DRM (6xxx) codes have no confident W3C equivalent - leave unmapped,
    // falls through to the raw native message (no worse than before this fix)
    return undefined;
};
