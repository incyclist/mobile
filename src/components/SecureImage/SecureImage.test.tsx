import React from 'react';
import { Platform } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { SecureImage } from './SecureImage';
import { getFileSystemBinding } from '../../bindings/fs';

jest.mock('../../bindings/fs', () => ({
    getFileSystemBinding: jest.fn(),
}));

// Mock constants
const MOCK_HTTPS_SOURCE = { uri: 'https://example.com/preview.jpg' };
const MOCK_FILE_SOURCE = { uri: 'file:///private/var/mobile/Containers/Shared/AppGroup/test/preview.png' };
const MOCK_BUNDLED = 123;

describe('SecureImage', () => {
    let mockFS: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.replaceProperty(Platform, 'OS', 'ios');
        (Platform.select as jest.Mock).mockImplementation((spec: any) => spec.ios);

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
        
        // Should be null initially
        expect(toJSON()).toBeNull();
        expect(mockFS.requestAccess).toHaveBeenCalledWith(MOCK_FILE_SOURCE.uri);

        await act(async () => {
            resolveAccess(true);
        });

        // Now it should render
        expect(toJSON()).not.toBeNull();
    });

    it('calls releaseAccess on unmount only when grant was acquired', async () => {
        const { unmount } = render(<SecureImage source={MOCK_FILE_SOURCE} />);
        
        await act(async () => {}); // flush promise

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
        (Platform.select as jest.Mock).mockImplementation((spec: any) => spec.android);
        
        const { toJSON } = render(<SecureImage source={MOCK_FILE_SOURCE} />);
        expect(toJSON()).not.toBeNull();
        expect(mockFS.requestAccess).not.toHaveBeenCalled();
    });
});