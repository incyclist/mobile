import React from 'react';
import { Image, Platform } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { SecureImage } from './SecureImage';
import { getFileSystemBinding } from '../../bindings/fs';
import { useCachedThumbnail } from '../../hooks/thumbnail/useCachedThumbnail';

jest.mock('../../bindings/fs', () => ({
    getFileSystemBinding: jest.fn(),
}));

jest.mock('../../hooks/thumbnail/useCachedThumbnail', () => ({
    useCachedThumbnail: jest.fn(() => ({ ready: true, cachedUri: undefined, onCacheError: jest.fn() })),
}));

const MOCK_HTTPS_SOURCE = { uri: 'https://example.com/preview.jpg' };
const MOCK_FILE_SOURCE = { uri: 'file:///private/var/mobile/Containers/Shared/AppGroup/test/preview.png' };
const MOCK_BUNDLED = 123;

describe('SecureImage', () => {
    let mockFS: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.replaceProperty(Platform, 'OS', 'ios');
        mockFS = {
            requestAccess: jest.fn().mockResolvedValue(true),
            releaseAccess: jest.fn().mockResolvedValue(true),
        };
        (getFileSystemBinding as jest.Mock).mockReturnValue(mockFS);
    });

    it('renders with https source (no gate)', () => {
        const { toJSON } = render(<SecureImage source={MOCK_HTTPS_SOURCE} />);
        expect(toJSON()).not.toBeNull();
        expect(mockFS.requestAccess).not.toHaveBeenCalled();
    });

    it('renders with bundled asset (no gate)', () => {
        const { toJSON } = render(<SecureImage source={MOCK_BUNDLED} />);
        expect(toJSON()).not.toBeNull();
        expect(mockFS.requestAccess).not.toHaveBeenCalled();
    });

    it('renders null before access on iOS file:// source', async () => {
        let resolveAccess: (v: boolean) => void = () => {};
        const accessPromise = new Promise<boolean>((resolve) => {
            resolveAccess = resolve;
        });
        mockFS.requestAccess.mockReturnValue(accessPromise);

        const { toJSON } = render(<SecureImage source={MOCK_FILE_SOURCE} />);

        expect(toJSON()).toBeNull();
        expect(mockFS.requestAccess).toHaveBeenCalledWith(MOCK_FILE_SOURCE.uri);

        await act(async () => {
            resolveAccess(true);
        });

        expect(toJSON()).not.toBeNull();
    });

    it('calls releaseAccess on unmount only when grant was acquired', async () => {
        const { unmount } = render(<SecureImage source={MOCK_FILE_SOURCE} />);

        await act(async () => {});

        unmount();
        expect(mockFS.releaseAccess).toHaveBeenCalledWith(MOCK_FILE_SOURCE.uri);
    });

    it('does not call releaseAccess if grant was not acquired', async () => {
        mockFS.requestAccess.mockResolvedValue(false);
        const { unmount } = render(<SecureImage source={MOCK_FILE_SOURCE} />);

        await act(async () => {});

        unmount();
        expect(mockFS.releaseAccess).not.toHaveBeenCalled();
    });

    it('renders Image directly on Android (no gate)', () => {
        jest.replaceProperty(Platform, 'OS', 'android');

        const { toJSON } = render(<SecureImage source={MOCK_FILE_SOURCE} />);
        expect(toJSON()).not.toBeNull();
        expect(mockFS.requestAccess).not.toHaveBeenCalled();
    });

    describe('thumbnail cache', () => {
        const mockHook = useCachedThumbnail as jest.Mock;

        it('shows the cached file instead of the network source', () => {
            mockHook.mockReturnValue({ ready: true, cachedUri: 'file:///app/thumbnails/x.img', onCacheError: jest.fn() });
            const { UNSAFE_getByType } = render(<SecureImage source={MOCK_HTTPS_SOURCE} thumbnailRouteKey="r1" />);
            expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'file:///app/thumbnails/x.img' });
            expect(mockHook).toHaveBeenCalledWith('r1', MOCK_HTTPS_SOURCE.uri, undefined);
        });

        it('shows the original source when nothing is cached', () => {
            mockHook.mockReturnValue({ ready: true, cachedUri: undefined, onCacheError: jest.fn() });
            const { UNSAFE_getByType } = render(<SecureImage source={MOCK_HTTPS_SOURCE} thumbnailRouteKey="r1" />);
            expect(UNSAFE_getByType(Image).props.source).toEqual(MOCK_HTTPS_SOURCE);
        });

        it('renders nothing until the local lookup has finished', () => {
            mockHook.mockReturnValue({ ready: false, cachedUri: undefined, onCacheError: jest.fn() });
            const { toJSON } = render(<SecureImage source={MOCK_HTTPS_SOURCE} thumbnailRouteKey="r1" />);
            expect(toJSON()).toBeNull();
        });

        it('reports a cached file that fails to display', () => {
            const onCacheError = jest.fn();
            mockHook.mockReturnValue({ ready: true, cachedUri: 'file:///app/thumbnails/x.img', onCacheError });
            const { UNSAFE_getByType } = render(<SecureImage source={MOCK_HTTPS_SOURCE} thumbnailRouteKey="r1" />);
            UNSAFE_getByType(Image).props.onError();
            expect(onCacheError).toHaveBeenCalled();
        });
    });

    it('passes the computer the thumbnail comes from to the thumbnail cache', () => {
        const link = { linkId: 'l1', thumbHandle: 't1' };
        render(<SecureImage thumbnailRouteKey="r1" thumbnailLink={link} />);
        expect(useCachedThumbnail).toHaveBeenCalledWith('r1', undefined, link);
    });

    it('shows nothing for a thumbnail that is neither cached nor has another source', () => {
        (useCachedThumbnail as jest.Mock).mockReturnValueOnce({ ready: true, cachedUri: undefined, onCacheError: jest.fn() });
        const { toJSON } = render(<SecureImage thumbnailRouteKey="r1" thumbnailLink={{ linkId: 'l1', thumbHandle: 't1' }} />);
        expect(toJSON()).toBeNull();
    });

    it('shows the cached thumbnail of a computer', () => {
        (useCachedThumbnail as jest.Mock).mockReturnValueOnce({ ready: true, cachedUri: 'file:///thumb.img', onCacheError: jest.fn() });
        const { UNSAFE_getByType } = render(<SecureImage thumbnailRouteKey="r1" thumbnailLink={{ linkId: 'l1', thumbHandle: 't1' }} />);
        expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'file:///thumb.img' });
    });
});
