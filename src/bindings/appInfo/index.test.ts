const mockLogEvent = jest.fn();
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}));
jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        get DocumentDirectoryPath(): string { throw new Error('fs boom'); },
        get TemporaryDirectoryPath(): string { throw new Error('fs boom'); },
    },
}));
jest.mock('react-native-device-info', () => ({
    __esModule: true,
    default: { getVersion: jest.fn() },
}));
jest.mock('react-native-default-preference', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));
jest.mock('uuid', () => ({ v4: jest.fn(() => 'session-id') }));
jest.mock('@settings', () => ({ __esModule: true, default: { APP_ENV: 'test' } }), { virtual: true });

import DeviceInfo from 'react-native-device-info';
import DefaultPreference from 'react-native-default-preference';
import { Platform } from 'react-native';
import { getAppInfo, getAppInfoBinding, getAppVersion, getOS } from './index';

describe('appInfo binding never throws', () => {
    beforeEach(() => mockLogEvent.mockClear());

    test('getAppVersion falls back to an empty string when DeviceInfo throws', () => {
        (DeviceInfo.getVersion as jest.Mock).mockImplementationOnce(() => { throw new Error('boom'); });
        expect(getAppVersion()).toBe('');
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'error', fn: 'getAppVersion', error: 'boom' }));
    });

    test('getOS falls back when the platform cannot be read', () => {
        const spy = jest.spyOn(Platform, 'Version', 'get').mockImplementation(() => { throw new Error('boom'); });
        expect(getOS()).toEqual({ platform: 'unknown', arch: 'react-native', release: '' });
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ fn: 'getOS' }));
        spy.mockRestore();
    });

    test('getAppInfo falls back when the file system paths cannot be read', () => {
        (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.2.3');
        expect(getAppInfo()).toEqual({ version: '', name: '', appDir: '', tempDir: '' });
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ fn: 'getAppInfo' }));
    });

    test('the binding resolves although the preference store rejects, and its functions are safe', async () => {
        (DefaultPreference.get as jest.Mock).mockRejectedValueOnce(new Error('prefs down'));
        const binding = await getAppInfoBinding();
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ fn: 'readActiveVersion', error: 'prefs down' }));
        expect(binding.session).toBe('session-id');
        expect(typeof binding.getUIVersion()).toBe('string');
        expect(binding.getAppDir()).toBe('');
        expect(binding.getTempDir()).toBe('');
        expect(binding.getChannel()).toBe('mobile');
        expect(binding.hasNativeFeature('local-link')).toBe(false);
    });
});
