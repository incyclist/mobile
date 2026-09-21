import { Platform } from 'react-native';

jest.mock('incyclist-services', () => ({
    getBindings: jest.fn(() => ({})),
    withExternalFileAccess: jest.fn((inner) => ({ wrapped: true, inner })),
}));

jest.mock('./logging', () => ({ getLogBinding: jest.fn(() => ({ logging: true })) }));
jest.mock('./appInfo', () => ({ getAppInfoBinding: jest.fn().mockResolvedValue({ appInfo: true }) }));
jest.mock('./user-settings', () => ({ getUserSettingsBinding: jest.fn(() => ({ settings: true })) }));
jest.mock('./secret', () => ({ getSecretBinding: jest.fn(() => ({ secret: true })) }));
jest.mock('./mq', () => ({ getMessageQueueBinding: jest.fn(() => ({ mq: true })) }));
jest.mock('./direct-connect', () => ({ getDirectConnectBinding: jest.fn(() => ({ wifi: true })) }));
jest.mock('./ble', () => ({ getBleBinding: jest.fn(() => ({ ble: true })) }));
jest.mock('./ui', () => ({ getUIBinding: jest.fn(() => ({ ui: true })) }));
jest.mock('./fs', () => ({ getFileSystemBinding: jest.fn(() => ({ fs: true })) }));
jest.mock('./path', () => ({ getPathBinding: jest.fn(() => ({ path: true })) }));
jest.mock('./video', () => ({ getVideoBinding: jest.fn(() => ({ video: true })) }));
jest.mock('./db', () => ({ getRepositoryBinding: jest.fn(() => ({ db: true })) }));
jest.mock('./loader', () => ({ getFileLoaderBinding: jest.fn(() => ({ loader: true })) }));
jest.mock('./crypto', () => ({ getCryptoBinding: jest.fn(() => ({ crypto: true })) }));
jest.mock('./fetch', () => ({ getFetchBinding: jest.fn(() => ({ fetch: true })) }));
jest.mock('./form', () => ({ getFormBinding: jest.fn(() => ({ form: true })) }));
jest.mock('./download', () => ({ MobileDownloadManager: jest.fn().mockImplementation(() => ({ downloadManager: true })) }));
jest.mock('./mapAvailability', () => ({ getMapAvailabilityBinding: jest.fn(() => ({ start: jest.fn() })) }));
jest.mock('./fileAccess', () => ({ getFileAccessBinding: jest.fn(() => ({ isSupported: () => true })) }));

describe('bindings/factory initBindings', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('on iOS, registers the fileAccess binding and wraps the loader', async () => {
        Platform.OS = 'ios';

        const { initBindings } = require('./factory');
        const { getFileAccessBinding } = require('./fileAccess');
        const { withExternalFileAccess } = require('incyclist-services');

        const bindings = await initBindings();

        expect(getFileAccessBinding).toHaveBeenCalled();
        expect(bindings.fileAccess).toBeDefined();
        expect(withExternalFileAccess).toHaveBeenCalledWith({ loader: true });
        expect(bindings.loader).toEqual({ wrapped: true, inner: { loader: true } });
    });

    it('on Android, does not register the fileAccess binding and leaves the loader unwrapped (no-op)', async () => {
        Platform.OS = 'android';

        const { initBindings } = require('./factory');
        const { getFileAccessBinding } = require('./fileAccess');
        const { withExternalFileAccess } = require('incyclist-services');

        const bindings = await initBindings();

        expect(getFileAccessBinding).not.toHaveBeenCalled();
        expect(bindings.fileAccess).toBeUndefined();
        expect(withExternalFileAccess).not.toHaveBeenCalled();
        expect(bindings.loader).toEqual({ loader: true });
    });

    it('still wires up every other binding regardless of platform', async () => {
        Platform.OS = 'android';

        const { initBindings } = require('./factory');
        const bindings = await initBindings();

        expect(bindings.logging).toBeDefined();
        expect(bindings.ui).toBeDefined();
        expect(bindings.fs).toBeDefined();
        expect(bindings.downloadManager).toBeDefined();
        expect(bindings.mapAvailability).toBeDefined();
    });
});
