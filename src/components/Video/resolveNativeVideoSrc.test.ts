import { resolveNativeVideoSrc } from './resolveNativeVideoSrc';

describe('resolveNativeVideoSrc', () => {
    test('rewrites an absolute Unix video:// URL to file://', () => {
        const src = 'video:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4';
        expect(resolveNativeVideoSrc(src)).toBe(
            'file:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4'
        );
    });

    test('rewrites an absolute Windows video:// URL to file://', () => {
        const src = 'video:///C:/Users/user/videos/route.mp4';
        expect(resolveNativeVideoSrc(src)).toBe('file:///C:/Users/user/videos/route.mp4');
    });

    test('leaves a relative video:// URL untouched (route-embedded, not downloaded)', () => {
        const src = 'video://./__tests__/data/rlv/IS_West.avi';
        expect(resolveNativeVideoSrc(src)).toBe(src);
    });

    test('leaves a non-video:// src untouched (http)', () => {
        const src = 'https://cdn.example.com/routes/FR_Galibier_Demo.mp4';
        expect(resolveNativeVideoSrc(src)).toBe(src);
    });

    test('leaves a non-video:// src untouched (already file://)', () => {
        const src = 'file:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4';
        expect(resolveNativeVideoSrc(src)).toBe(src);
    });

    test('is a no-op for undefined/empty src', () => {
        expect(resolveNativeVideoSrc(undefined as unknown as string)).toBeUndefined();
        expect(resolveNativeVideoSrc('')).toBe('');
    });
});
