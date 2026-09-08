import { Dimensions, PixelRatio } from 'react-native';
import RNFS from 'react-native-fs';
import { captureScreen } from 'react-native-view-shot';
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
