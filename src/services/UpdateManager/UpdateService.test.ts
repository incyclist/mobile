jest.mock('@settings', () => ({ __esModule: true, default: { APP_ENV: 'test' } }), { virtual: true });

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

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
    getAppVersion: jest.fn(),
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
import { Platform } from 'react-native';
import { exists, readDir, unlink, downloadFile } from 'react-native-fs';
import { getAppVersion } from '../../bindings/appInfo';
import { getUserSettingsBinding } from '../../bindings/user-settings';
import { getSecret } from '../../bindings/secret';
import { UpdateService } from './UpdateService';

describe('UpdateService - x-app-version header', () => {
    const NATIVE_VERSION = '9.9.9'; // the real installed native version, per DeviceInfo/getAppVersion

    beforeEach(() => {
        jest.clearAllMocks();

        (getUserSettingsBinding as jest.Mock).mockReturnValue({
            getAll: jest.fn().mockResolvedValue(undefined),
            getValue: jest.fn().mockReturnValue('test-uuid'),
        });

        (getSecret as jest.Mock).mockReturnValue(undefined);

        (getAppVersion as jest.Mock).mockReturnValue(NATIVE_VERSION);

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

describe('UpdateService - OTA platform gate', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (getUserSettingsBinding as jest.Mock).mockReturnValue({
            getAll: jest.fn().mockResolvedValue(undefined),
            getValue: jest.fn().mockReturnValue('test-uuid'),
        });
        (getSecret as jest.Mock).mockReturnValue(undefined);
        (getAppVersion as jest.Mock).mockReturnValue('9.9.9');
        (DefaultPreference.get as jest.Mock).mockResolvedValue(null);
        (exists as jest.Mock).mockResolvedValue(false);
        (readDir as jest.Mock).mockResolvedValue([]);

        global.fetch = jest.fn().mockResolvedValue({ ok: false });
    });

    afterEach(() => {
        Platform.OS = 'android';
        // @ts-ignore - test-only cleanup of the global fetch stub
        delete global.fetch;
    });

    test('never checks for updates on iOS - there is no bundle:ios build and AppDelegate never reads active_bundle_path', async () => {
        Platform.OS = 'ios';

        await UpdateService.checkForUpdates();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(getUserSettingsBinding).not.toHaveBeenCalled();
    });

    test('still checks for updates on android', async () => {
        Platform.OS = 'android';

        await UpdateService.checkForUpdates();

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});

describe('UpdateService - cleanup sweep', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Platform.OS = 'android';

        (getUserSettingsBinding as jest.Mock).mockReturnValue({
            getAll: jest.fn().mockResolvedValue(undefined),
            getValue: jest.fn().mockReturnValue('test-uuid'),
        });
        (getSecret as jest.Mock).mockReturnValue(undefined);
        (getAppVersion as jest.Mock).mockReturnValue('9.9.9');

        // No bundle update available in any of these tests - only the sweep is under test.
        global.fetch = jest.fn().mockResolvedValue({ ok: false });

        (exists as jest.Mock).mockImplementation(() => Promise.resolve(false));
        (readDir as jest.Mock).mockImplementation(() => Promise.resolve([]));
    });

    afterEach(() => {
        // @ts-ignore - test-only cleanup of the global fetch stub
        delete global.fetch;
    });

    test('activeVersion == null wipes everything under updates/, including stray (non-directory) entries', async () => {
        (DefaultPreference.get as jest.Mock).mockResolvedValue(null);

        (exists as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') return Promise.resolve(true);
            return Promise.resolve(false);
        });

        (readDir as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') {
                return Promise.resolve([
                    { name: '0.0.44', path: '/doc/updates/0.0.44', isDirectory: () => true },
                    { name: '0.0.45', path: '/doc/updates/0.0.45', isDirectory: () => true },
                    { name: 'stray.txt', path: '/doc/updates/stray.txt', isDirectory: () => false },
                ]);
            }
            return Promise.resolve([]);
        });

        await UpdateService.checkForUpdates();

        expect(unlink).toHaveBeenCalledWith('/doc/updates/0.0.44');
        expect(unlink).toHaveBeenCalledWith('/doc/updates/0.0.45');
        expect(unlink).toHaveBeenCalledWith('/doc/updates/stray.txt');
    });

    test('keeps the active version, removes stray files and other stale directories', async () => {
        (DefaultPreference.get as jest.Mock).mockImplementation((key: string) => {
            if (key === 'active_bundle_version') return Promise.resolve('0.0.45');
            if (key === 'active_bundle_path') return Promise.resolve('/doc/updates/0.0.45');
            return Promise.resolve(null);
        });

        (exists as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') return Promise.resolve(true);
            return Promise.resolve(false);
        });

        (readDir as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') {
                return Promise.resolve([
                    { name: '0.0.44', path: '/doc/updates/0.0.44', isDirectory: () => true },
                    { name: '0.0.45', path: '/doc/updates/0.0.45', isDirectory: () => true },
                    { name: 'orphan.tmp', path: '/doc/updates/orphan.tmp', isDirectory: () => false },
                ]);
            }
            return Promise.resolve([]);
        });

        await UpdateService.checkForUpdates();

        expect(unlink).toHaveBeenCalledWith('/doc/updates/0.0.44');
        expect(unlink).toHaveBeenCalledWith('/doc/updates/orphan.tmp');
        expect(unlink).not.toHaveBeenCalledWith('/doc/updates/0.0.45');
    });

    test('removes stale update_*.zip leftovers from CachesDirectoryPath but leaves other cache entries alone', async () => {
        (DefaultPreference.get as jest.Mock).mockResolvedValue(null);

        (exists as jest.Mock).mockImplementation((path: string) => {
            if (path === '/cache') return Promise.resolve(true);
            return Promise.resolve(false);
        });

        (readDir as jest.Mock).mockImplementation((path: string) => {
            if (path === '/cache') {
                return Promise.resolve([
                    { name: 'update_0.0.44.zip', path: '/cache/update_0.0.44.zip', isDirectory: () => false },
                    { name: 'update_0.0.45.zip', path: '/cache/update_0.0.45.zip', isDirectory: () => false },
                    { name: 'unrelated.tmp', path: '/cache/unrelated.tmp', isDirectory: () => false },
                    { name: 'somedir', path: '/cache/somedir', isDirectory: () => true },
                ]);
            }
            return Promise.resolve([]);
        });

        await UpdateService.checkForUpdates();

        expect(unlink).toHaveBeenCalledWith('/cache/update_0.0.44.zip');
        expect(unlink).toHaveBeenCalledWith('/cache/update_0.0.45.zip');
        expect(unlink).not.toHaveBeenCalledWith('/cache/unrelated.tmp');
        expect(unlink).not.toHaveBeenCalledWith('/cache/somedir');
    });

    test('a readDir failure on one sweep target does not stop the other from running', async () => {
        (DefaultPreference.get as jest.Mock).mockResolvedValue(null);

        (exists as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') return Promise.resolve(true);
            if (path === '/cache') return Promise.resolve(true);
            return Promise.resolve(false);
        });

        (readDir as jest.Mock).mockImplementation((path: string) => {
            if (path === '/doc/updates') return Promise.reject(new Error('permission denied'));
            if (path === '/cache') {
                return Promise.resolve([
                    { name: 'update_0.0.44.zip', path: '/cache/update_0.0.44.zip', isDirectory: () => false },
                ]);
            }
            return Promise.resolve([]);
        });

        // Errors are swallowed (per design) - checkForUpdates must not throw.
        await expect(UpdateService.checkForUpdates()).resolves.toBeUndefined();

        expect(unlink).toHaveBeenCalledWith('/cache/update_0.0.44.zip');
    });
});

describe('UpdateService - failed_bundle_version refusal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Platform.OS = 'android';

        (getUserSettingsBinding as jest.Mock).mockReturnValue({
            getAll: jest.fn().mockResolvedValue(undefined),
            getValue: jest.fn().mockReturnValue('test-uuid'),
        });
        (getSecret as jest.Mock).mockReturnValue(undefined);
        (getAppVersion as jest.Mock).mockReturnValue('9.9.9');

        (exists as jest.Mock).mockResolvedValue(false);
        (readDir as jest.Mock).mockResolvedValue([]);
        (downloadFile as jest.Mock).mockReturnValue({ promise: Promise.resolve({ statusCode: 200 }) });

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({ bundleVersion: '0.1.5', bundleUrl: '/bundle.zip' }),
        });
    });

    afterEach(() => {
        // @ts-ignore - test-only cleanup of the global fetch stub
        delete global.fetch;
    });

    test('refuses a bundle version that was previously blacklisted as failed_bundle_version, even though it is newer', async () => {
        (DefaultPreference.get as jest.Mock).mockImplementation((key: string) => {
            if (key === 'failed_bundle_version') return Promise.resolve('0.1.5');
            if (key === 'active_bundle_version') return Promise.resolve('0.1.0');
            return Promise.resolve(null);
        });

        await UpdateService.checkForUpdates();

        expect(downloadFile).not.toHaveBeenCalled();
    });

    test('accepts a newer bundle version that does not match failed_bundle_version', async () => {
        (DefaultPreference.get as jest.Mock).mockImplementation((key: string) => {
            if (key === 'failed_bundle_version') return Promise.resolve('0.1.4');
            if (key === 'active_bundle_version') return Promise.resolve('0.1.0');
            return Promise.resolve(null);
        });

        await UpdateService.checkForUpdates();

        expect(downloadFile).toHaveBeenCalled();
    });
});
