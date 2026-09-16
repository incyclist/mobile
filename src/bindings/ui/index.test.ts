import { Dimensions, PixelRatio } from 'react-native';
import RNFS from 'react-native-fs';
import { captureScreen } from 'react-native-view-shot';
import { pickDirectory } from '@react-native-documents/picker';
import { UIBinding } from './index';

jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        DocumentDirectoryPath: '/docs',
        exists: jest.fn().mockResolvedValue(true),
        mkdir: jest.fn(),
        unlink: jest.fn(),
        moveFile: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('react-native-view-shot', () => ({
    captureScreen: jest.fn().mockResolvedValue('file:///tmp/shot.jpg'),
}));

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('react-native-share', () => ({
    __esModule: true,
    default: { open: jest.fn() },
}));

jest.mock('@react-native-documents/picker', () => ({
    pickDirectory: jest.fn(),
}));

jest.mock('@sayem314/react-native-keep-awake', () => ({
    activateKeepAwake: jest.fn(),
    deactivateKeepAwake: jest.fn(),
}));

jest.mock('react-native-localize', () => ({
    getLocales: jest.fn().mockReturnValue([]),
}));

describe('UIBinding.takeScreenshot', () => {
    let ui: UIBinding;

    beforeEach(() => {
        ui = new UIBinding();
        jest.clearAllMocks();
        (RNFS.exists as jest.Mock).mockResolvedValue(true);
        (RNFS.moveFile as jest.Mock).mockResolvedValue(undefined);
    });

    it('caps the capture to MAX_SCREENSHOT_DIMENSION on a high-resolution screen, preserving aspect ratio', async () => {
        jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1280, height: 720, scale: 3, fontScale: 1 });
        jest.spyOn(PixelRatio, 'get').mockReturnValue(3); // native pixels: 3840 x 2160

        await ui.takeScreenshot({ fileName: 'shot.jpg' });

        expect(captureScreen).toHaveBeenCalledWith(expect.objectContaining({
            width: 1600,
            height: 900, // 3840x2160 scaled so the longer edge is 1600, aspect ratio preserved
        }));
    });

    it('does not upscale a screen already under MAX_SCREENSHOT_DIMENSION', async () => {
        jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 640, height: 360, scale: 2, fontScale: 1 });
        jest.spyOn(PixelRatio, 'get').mockReturnValue(2); // native pixels: 1280 x 720

        await ui.takeScreenshot({ fileName: 'shot.jpg' });

        expect(captureScreen).toHaveBeenCalledWith(expect.objectContaining({
            width: 1280,
            height: 720,
        }));
    });
});

describe('UIBinding.selectDirectory', () => {
    let ui: UIBinding;

    beforeEach(() => {
        ui = new UIBinding();
        jest.clearAllMocks();
    });

    it('passes requestLongTermAccess and no initialDirectoryUri when none is given', async () => {
        (pickDirectory as jest.Mock).mockResolvedValue({
            uri: 'file:///picked/folder',
            bookmarkStatus: 'success',
            bookmark: 'bookmark-data',
        });

        await ui.selectDirectory();

        expect(pickDirectory).toHaveBeenCalledWith({ requestLongTermAccess: true });
    });

    it('forwards options.initialDirectory as initialDirectoryUri', async () => {
        (pickDirectory as jest.Mock).mockResolvedValue({
            uri: 'file:///picked/folder',
            bookmarkStatus: 'success',
            bookmark: 'bookmark-data',
        });

        await ui.selectDirectory({ initialDirectory: 'file:///start/here' });

        expect(pickDirectory).toHaveBeenCalledWith({
            requestLongTermAccess: true,
            initialDirectoryUri: 'file:///start/here',
        });
    });

    it('returns grant from a successful bookmark', async () => {
        (pickDirectory as jest.Mock).mockResolvedValue({
            uri: 'file:///picked/folder',
            bookmarkStatus: 'success',
            bookmark: 'bookmark-data',
        });

        const result = await ui.selectDirectory();

        expect(result.canceled).toBe(false);
        expect(result.grant).toBe('bookmark-data');
        expect(result.grantError).toBeUndefined();
    });

    it('returns grantError when bookmarking fails, without a grant', async () => {
        (pickDirectory as jest.Mock).mockResolvedValue({
            uri: 'file:///picked/folder',
            bookmarkStatus: 'error',
            bookmarkError: 'could not create bookmark',
        });

        const result = await ui.selectDirectory();

        expect(result.grant).toBeUndefined();
        expect(result.grantError).toBe('could not create bookmark');
    });

    it('derives selected/displayName from the picked uri as before', async () => {
        (pickDirectory as jest.Mock).mockResolvedValue({
            uri: 'file:///picked/My%20Routes',
            bookmarkStatus: 'success',
            bookmark: 'bookmark-data',
        });

        const result = await ui.selectDirectory();

        expect(result.selected).toBe('file:///picked/My Routes');
        expect(result.displayName).toBe('My Routes');
    });

    it('cancellation → { canceled: true }', async () => {
        (pickDirectory as jest.Mock).mockRejectedValue(new Error('cancelled'));

        const result = await ui.selectDirectory();

        expect(result).toEqual({ canceled: true });
    });
});
