jest.mock('@settings', () => ({ __esModule: true, default: { APP_ENV: 'test' } }), { virtual: true });

jest.mock('react-native-fs', () => ({
    __esModule: true,
    exists: jest.fn().mockResolvedValue(false),
    mkdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    readDir: jest.fn().mockResolvedValue([]),
    downloadFile: jest.fn(),
    DocumentDirectoryPath: '/doc',
    CachesDirectoryPath: '/cache',
}));

jest.mock('react-native-zip-archive', () => ({
    unzip: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-default-preference', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../../bindings/appInfo', () => ({
    isDevVariant: false,
    isProdVariant: true,
    getAppInfoBinding: jest.fn(),
}));

jest.mock('../../bindings/user-settings', () => ({
    getUserSettingsBinding: jest.fn(),
}));

jest.mock('../../bindings/secret', () => ({
    getSecret: jest.fn(),
}));

// app.json's appVersion is baked into the JS bundle at build time and can trail (or lead) the
// real installed native version once this bundle is served as a hot update - deliberately
// different from the mocked getAppVersion() below so the test fails if the header regresses
// to reading app.json again.
jest.mock('../../../app.json', () => ({
    name: 'incyclist',
    appVersion: '1.0.20',
    bundleVersion: '0.1.0',
}));

import DefaultPreference from 'react-native-default-preference';
import { getAppInfoBinding } from '../../bindings/appInfo';
import { getUserSettingsBinding } from '../../bindings/user-settings';
import { getSecret } from '../../bindings/secret';
import { UpdateService } from './UpdateService';

describe('UpdateService - x-app-version header', () => {
    const NATIVE_VERSION = '9.9.9'; // the real installed native version, per DeviceInfo/getAppInfoBinding

    beforeEach(() => {
        jest.clearAllMocks();

        (getUserSettingsBinding as jest.Mock).mockReturnValue({
            getAll: jest.fn().mockResolvedValue(undefined),
            getValue: jest.fn().mockReturnValue('test-uuid'),
        });

        (getSecret as jest.Mock).mockReturnValue(undefined);

        (getAppInfoBinding as jest.Mock).mockResolvedValue({
            getAppVersion: () => NATIVE_VERSION,
        });

        (DefaultPreference.get as jest.Mock).mockResolvedValue(null);

        global.fetch = jest.fn().mockResolvedValue({ ok: false });
    });

    afterEach(() => {
        // @ts-ignore - test-only cleanup of the global fetch stub
        delete global.fetch;
    });

    test('sends the installed native version (device-info binding), not app.json`s bundle-baked-in appVersion', async () => {
        await UpdateService.checkForUpdates();

        expect(global.fetch).toHaveBeenCalledTimes(1);

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers['x-app-version']).toBe(NATIVE_VERSION);
        expect(options.headers['x-app-version']).not.toBe('1.0.20');
    });
});
