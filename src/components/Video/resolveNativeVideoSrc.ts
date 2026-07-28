const VIDEO_SCHEME_PREFIX = 'video://';

/**
 * Rewrites a `video://` URI into one react-native-video's native Android player
 * (ExoPlayer) actually understands for local playback.
 *
 * ExoPlayer's native code (react-native-video's `ReactExoplayerView.java`) only
 * special-cases the `"asset"` and `"file"` URI schemes for local files — any other
 * scheme (including our own `"video"`) falls through to a network-backed
 * `DataSource`, which is why local downloaded videos fail with
 * `ERROR_CODE_IO_FILE_NOT_FOUND` / a network error even once the URL itself is
 * well-formed. `video://` only ever worked on desktop, where Electron's main
 * process registers a real custom protocol handler for it.
 *
 * A well-formed absolute-path `video://` URL always has a leading slash
 * immediately after the `video://` prefix (`video:///<unix-path>` or
 * `video:///<drive>:<path>` on Windows — see `buildVideoUrl()` in
 * `incyclist-services`, services/src/routes/base/parsers/utils.ts, which produces
 * these). Swapping the scheme name onto that same path is enough, since ExoPlayer
 * resolves `"file"` locally via its own `DataSource.Factory`.
 *
 * Relative `video://` URLs (e.g. `video://./bundled/route.mp4` — route-embedded,
 * not downloaded, videos) have no leading slash after the prefix and are left
 * untouched: they're resolved through a different path upstream
 * (`RLVDisplayService.cleanupUrl()` in incyclist-services already rewrites
 * non-`.avi` `video:` URLs to `file:` there), and this helper only needs to cover
 * the absolute, downloaded-video case that reaches this component unconverted.
 *
 * Any other src (http/https, file://, already-relative, undefined, etc.) is
 * returned unchanged.
 */
export const resolveNativeVideoSrc = (src: string): string => {
    if (!src?.startsWith(VIDEO_SCHEME_PREFIX)) {
        return src;
    }

    const rest = src.slice(VIDEO_SCHEME_PREFIX.length);
    if (!rest.startsWith('/')) {
        // relative video:// URL - leave as-is
        return src;
    }

    return `file://${rest}`;
};
