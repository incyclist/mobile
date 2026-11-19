const mockLogEvent = jest.fn();
const mockGetGenericPassword = jest.fn();
const mockSetGenericPassword = jest.fn();
const mockNetFetch = jest.fn();
const mockNetAddListener = jest.fn();
const mockAppStateAddListener = jest.fn();
const mockMMKVGetString = jest.fn();
const mockMMKVSet = jest.fn();

jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
    AppState: { addEventListener: (...args: any[]) => mockAppStateAddListener(...args) },
}));
jest.mock('react-native-mmkv', () => ({
    createMMKV: jest.fn(() => ({ getString: mockMMKVGetString, set: mockMMKVSet })),
}));
jest.mock('react-native-keychain', () => ({
    getGenericPassword: (...args: any[]) => mockGetGenericPassword(...args),
    setGenericPassword: (...args: any[]) => mockSetGenericPassword(...args),
}));
jest.mock('@react-native-community/netinfo', () => ({
    __esModule: true,
    default: {
        fetch: (...args: any[]) => mockNetFetch(...args),
        addEventListener: (...args: any[]) => mockNetAddListener(...args),
    },
}));
jest.mock('react-native-device-info', () => ({
    getBundleId: () => 'bundle',
    getVersion: () => '1.0',
}));
jest.mock('../crypto', () => ({
    getCryptoBinding: () => ({ randomBytes: () => Buffer.from('00'.repeat(32), 'hex') }),
}));
jest.mock('./attestation', () => ({
    getAttestationProvider: () => ({ getAttestationToken: jest.fn().mockResolvedValue('token') }),
}));
jest.mock('@settings', () => ({ __esModule: true, default: {} }), { virtual: true });
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}));
jest.mock('../appInfo', () => ({ isProdVariant: true }));
jest.mock('../user-settings', () => ({
    getUserSettingsBinding: () => ({ getValue: jest.fn().mockReturnValue('uuid-1'), getAll: jest.fn() }),
}));

const validCache = JSON.stringify({
    secrets: { MQ_USER: 'u', MQ_PASSWORD: 'p' },
    expiresAt: 'x',
    fetchedAt: new Date().toISOString(),
});

const wrappedError = () => {
    const cause = new Error('Keystore operation failed');
    (cause as any).name = 'KeyStoreException';
    const err: any = new Error('Wrapped error: Keystore operation failed');
    err.cause = cause;
    err.name = 'com.oblador.keychain.exceptions.CryptoFailedException';
    err.code = 'E_CRYPTO_FAILED';
    err.userInfo = { code: '-30' };
    return err;
};

const load = () => {
    let mod: typeof import('./index');
    jest.isolateModules(() => {
        mod = require('./index');
    });
    return mod!;
};

const logged = (message: string) =>
    mockLogEvent.mock.calls.map(c => c[0]).filter(e => e.message === message);

const flush = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('SecretBinding', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockNetFetch.mockResolvedValue({ isConnected: true });
        mockNetAddListener.mockReturnValue(jest.fn());
        mockAppStateAddListener.mockReturnValue({ remove: jest.fn() });
        mockMMKVGetString.mockReturnValue(validCache);
        mockGetGenericPassword.mockResolvedValue({ password: 'abcd' });
        (global as any).fetch = jest.fn().mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => ({ valid: true }),
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('normal path', () => {
        test('cache found and valid: status ok, no retry scheduled', async () => {
            const { initSecrets, getSecretsStatus, getSecret } = load();

            await initSecrets({ timeout: 5000 });

            expect(getSecretsStatus()).toBe('ok');
            expect(getSecret('MQ_USER')).toBe('u');
            expect(mockAppStateAddListener).not.toHaveBeenCalled();
        });
    });

    describe('in-flight guard', () => {
        test('a second initSecrets during a pending init reuses the running init', async () => {
            let release: (v: any) => void = () => {};
            mockGetGenericPassword.mockReturnValue(new Promise(r => { release = r; }));
            const { initSecrets } = load();

            const first = initSecrets({ timeout: 100 });
            jest.advanceTimersByTime(100);
            await first; // timeout race resolved, init still running

            const second = initSecrets({ timeout: 100 });
            jest.advanceTimersByTime(100);
            await second;

            expect(mockGetGenericPassword).toHaveBeenCalledTimes(1);

            release({ password: 'abcd' });
            await flush();
        });

        test('a new init can start once the previous one has finished', async () => {
            const { initSecrets } = load();

            await initSecrets({ timeout: 5000 });
            await initSecrets({ timeout: 5000 });

            expect(mockGetGenericPassword).toHaveBeenCalledTimes(2);
        });
    });

    describe('cause-chain logging', () => {
        test('logs code, name, cause and native code as strings when the Keychain rejects', async () => {
            mockGetGenericPassword.mockRejectedValue(wrappedError());
            const { initSecrets, getSecretsStatus } = load();

            await initSecrets({ timeout: 5000 });

            expect(getSecretsStatus()).toBe('missing');
            const [event] = logged('error');
            expect(event).toMatchObject({
                fn: 'performInit',
                error: 'Wrapped error: Keystore operation failed',
                errorName: 'com.oblador.keychain.exceptions.CryptoFailedException',
                errorCode: 'E_CRYPTO_FAILED',
                causeMessage: 'Keystore operation failed',
                nativeCode: '-30',
            });
            expect(event.stack).toBeDefined();
        });

        test('logs empty strings for missing cause information', async () => {
            mockGetGenericPassword.mockRejectedValue(new Error('boom'));
            const { initSecrets } = load();

            await initSecrets({ timeout: 5000 });

            const [event] = logged('error');
            expect(event.errorCode).toBe('');
            expect(event.causeMessage).toBe('');
            expect(event.nativeCode).toBe('');
        });
    });

    describe('retry after failed init', () => {
        test('retries with back-off and notifies listeners once secrets are available', async () => {
            mockGetGenericPassword
                .mockRejectedValueOnce(wrappedError())
                .mockResolvedValue({ password: 'abcd' });
            const { initSecrets, getSecretBinding, getSecretsStatus } = load();
            const onRecovered = jest.fn();
            getSecretBinding().onRecovered(onRecovered);

            await initSecrets({ timeout: 5000 });
            expect(getSecretsStatus()).toBe('missing');
            expect(logged('secrets retry scheduled')).toHaveLength(1);
            expect(onRecovered).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(60000);
            await flush();

            expect(mockGetGenericPassword).toHaveBeenCalledTimes(2);
            expect(getSecretsStatus()).toBe('ok');
            expect(onRecovered).toHaveBeenCalledTimes(1);
        });

        test('delays grow and attempts are bounded', async () => {
            mockGetGenericPassword.mockRejectedValue(wrappedError());
            const { initSecrets } = load();

            await initSecrets({ timeout: 5000 });
            await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
            await flush();

            const delays = logged('secrets retry scheduled').map(e => Number(e.retryDelay));
            expect(delays.length).toBeGreaterThan(1);
            expect(delays.length).toBeLessThanOrEqual(10);
            for (let i = 1; i < delays.length; i++) {
                expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
            }
            expect(logged('secrets retry exhausted')).toHaveLength(1);
            const calls = mockGetGenericPassword.mock.calls.length;

            await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(calls);
            expect(jest.getTimerCount()).toBe(0);
        });

        test('does not retry when missing because the device is offline on first install', async () => {
            mockMMKVGetString.mockReturnValue(undefined);
            mockNetFetch.mockResolvedValue({ isConnected: false });
            const { initSecrets, getSecretsStatus } = load();

            await initSecrets({ timeout: 5000 });

            expect(getSecretsStatus()).toBe('missing');
            expect(logged('secrets retry scheduled')).toHaveLength(0);
            expect(mockAppStateAddListener).not.toHaveBeenCalled();
        });

        test('retries immediately when the app returns to the foreground', async () => {
            mockGetGenericPassword
                .mockRejectedValueOnce(wrappedError())
                .mockResolvedValue({ password: 'abcd' });
            const { initSecrets, getSecretsStatus } = load();

            await initSecrets({ timeout: 5000 });
            const handler = mockAppStateAddListener.mock.calls[0][1];

            handler('background');
            await flush();
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(1);

            handler('active');
            await flush();
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(2);
            expect(getSecretsStatus()).toBe('ok');
        });

        test('retries when connectivity is regained, not on the initial state event', async () => {
            mockGetGenericPassword
                .mockRejectedValueOnce(wrappedError())
                .mockResolvedValue({ password: 'abcd' });
            const { initSecrets, getSecretsStatus } = load();

            await initSecrets({ timeout: 5000 });
            const handler = mockNetAddListener.mock.calls[0][0];

            handler({ isConnected: true }); // initial state
            await flush();
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(1);

            handler({ isConnected: false });
            handler({ isConnected: true });
            await flush();
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(2);
            expect(getSecretsStatus()).toBe('ok');
        });

        test('a trigger while an init is running does not start a second one', async () => {
            let release: (v: any) => void = () => {};
            mockGetGenericPassword
                .mockRejectedValueOnce(wrappedError())
                .mockReturnValueOnce(new Promise(r => { release = r; }));
            const { initSecrets } = load();

            await initSecrets({ timeout: 5000 });
            const handler = mockAppStateAddListener.mock.calls[0][1];

            handler('active');
            handler('active');
            await flush();
            expect(mockGetGenericPassword).toHaveBeenCalledTimes(2);

            release({ password: 'abcd' });
            await flush();
        });
    });
});
