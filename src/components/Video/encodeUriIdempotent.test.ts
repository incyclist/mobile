import { encodeUriIdempotent } from './encodeUriIdempotent';

describe('encodeUriIdempotent', () => {
    test('does not double-encode a URL services already percent-encoded (regression)', () => {
        const src = 'file:///private/var/mobile/Containers/Shared/AppGroup/4F9DA801-C1CA-4BD1-8639-F6F70372FAC5/File%20Provider%20Storage/Input/DK_small_faststart.mp4';
        expect(encodeUriIdempotent(src)).toBe(src);
    });

    test('encodes a raw, unencoded path containing spaces', () => {
        const src = 'file:///Users/user/My Videos/route.mp4';
        expect(encodeUriIdempotent(src)).toBe('file:///Users/user/My%20Videos/route.mp4');
    });

    test('is a no-op for a URL with no characters needing encoding', () => {
        const src = 'file:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4';
        expect(encodeUriIdempotent(src)).toBe(src);
    });

    test('falls back to a single raw encode when the input has a malformed percent-sequence', () => {
        const src = 'file:///videos/50% off.mp4';
        expect(encodeUriIdempotent(src)).toBe('file:///videos/50%25%20off.mp4');
    });

    test('is a no-op for undefined/empty input', () => {
        expect(encodeUriIdempotent(undefined as unknown as string)).toBeUndefined();
        expect(encodeUriIdempotent('')).toBe('');
    });
});
