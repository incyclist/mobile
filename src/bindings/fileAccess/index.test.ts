import { Platform, TurboModuleRegistry } from 'react-native';
import { FileAccessBinding } from './index';

jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        DocumentDirectoryPath: '/app/Documents',
        CachesDirectoryPath: '/app/Library/Caches',
        TemporaryDirectoryPath: '/app/tmp',
        LibraryDirectoryPath: '/app/Library',
    },
}));

jest.mock('react-native', () => {
    const nativeModule = {
        activateGrant: jest.fn(),
        deactivateGrant: jest.fn(),
        captureGrant: jest.fn(),
        checkAccess: jest.fn(),
        getAvailability: jest.fn(),
        startDownload: jest.fn(),
        evict: jest.fn(),
        isCloudIdentityAvailable: jest.fn(),
        getPrivateDir: jest.fn(),
        copyFile: jest.fn(),
    };
    return {
        TurboModule: {},
        TurboModuleRegistry: {
            get: jest.fn().mockReturnValue(nativeModule),
        },
        Platform: { OS: 'ios' },
    };
});

const native = TurboModuleRegistry.get<any>('ExternalFileAccess');

describe('FileAccessBinding', () => {
    let binding: FileAccessBinding;

    beforeEach(() => {
        binding = new FileAccessBinding();
        jest.clearAllMocks();
        Platform.OS = 'ios';
    });

    describe('isSupported', () => {
        it('true on iOS with the native module present', () => {
            expect(binding.isSupported()).toBe(true);
        });

        it('false when not on iOS', () => {
            Platform.OS = 'android';
            expect(binding.isSupported()).toBe(false);
        });
    });

    describe('classifyLocation', () => {
        it('app sandbox path (Documents) → app', () => {
            expect(binding.classifyLocation('/app/Documents/routes/route.xml')).toBe('app');
        });

        it('app sandbox path (Library) → app', () => {
            expect(binding.classifyLocation('file:///app/Library/Application Support/x')).toBe('app');
        });

        it('iCloud Drive path (Mobile Documents) → icloud', () => {
            const path = 'file:///private/var/mobile/Library/Mobile Documents/com~apple~CloudDocs/IncyclistTest/route.mp4';
            expect(binding.classifyLocation(path)).toBe('icloud');
        });

        it('On My iPad path (File Provider Storage) → on-device', () => {
            const path = 'file:///private/var/mobile/Containers/Shared/AppGroup/GROUP/File Provider Storage/IncyclistTest/route.mp4';
            expect(binding.classifyLocation(path)).toBe('on-device');
        });

        it('NAS / SMB path (LiveFiles) → network', () => {
            const path = 'file:///private/var/mobile/Library/LiveFiles/com.apple.filesystems.smbclientd/share/routes';
            expect(binding.classifyLocation(path)).toBe('network');
        });

        it('unrecognised external path → other', () => {
            expect(binding.classifyLocation('file:///somewhere/else/route.mp4')).toBe('other');
        });

        it('percent-encoded path decodes before matching', () => {
            const path = 'file:///private/var/mobile/Library/Mobile%20Documents/com~apple~CloudDocs/route.mp4';
            expect(binding.classifyLocation(path)).toBe('icloud');
        });
    });

    describe('grants', () => {
        it('activateGrant delegates and returns the native result unchanged', async () => {
            const activation = { resolvedPath: '/resolved/path', isStale: false };
            native.activateGrant.mockResolvedValue(activation);

            const result = await binding.activateGrant('grant-token');

            expect(native.activateGrant).toHaveBeenCalledWith('grant-token');
            expect(result).toBe(activation);
        });

        it('deactivateGrant delegates with the resolved path', async () => {
            native.deactivateGrant.mockResolvedValue(undefined);

            await binding.deactivateGrant('/resolved/path');

            expect(native.deactivateGrant).toHaveBeenCalledWith('/resolved/path');
        });

        it('captureGrant normalises a native null to undefined', async () => {
            native.captureGrant.mockResolvedValue(null);

            const result = await binding.captureGrant('/some/folder');

            expect(result).toBeUndefined();
        });

        it('captureGrant passes through a real grant unchanged', async () => {
            native.captureGrant.mockResolvedValue('captured-grant');

            const result = await binding.captureGrant('/some/folder');

            expect(result).toBe('captured-grant');
        });

        it('checkAccess delegates and returns the native probe result unchanged', async () => {
            const probe = { state: 'denied' as const, errno: 13 };
            native.checkAccess.mockResolvedValue(probe);

            const result = await binding.checkAccess('/some/path');

            expect(native.checkAccess).toHaveBeenCalledWith('/some/path');
            expect(result).toBe(probe);
        });

        it('propagates a native rejection', async () => {
            native.checkAccess.mockRejectedValue(new Error('boom'));

            await expect(binding.checkAccess('/some/path')).rejects.toThrow('boom');
        });
    });

    describe('cloud files', () => {
        it('getAvailability delegates and returns the native result unchanged', async () => {
            const availability = {
                isUbiquitous: true,
                downloadStatus: 'not-downloaded' as const,
                isDownloading: false,
                downloadRequested: false,
            };
            native.getAvailability.mockResolvedValue(availability);

            const result = await binding.getAvailability('/some/path');

            expect(result).toBe(availability);
        });

        it('startDownload delegates', async () => {
            native.startDownload.mockResolvedValue(undefined);
            await binding.startDownload('/some/path');
            expect(native.startDownload).toHaveBeenCalledWith('/some/path');
        });

        it('evict delegates', async () => {
            native.evict.mockResolvedValue(undefined);
            await binding.evict('/some/path');
            expect(native.evict).toHaveBeenCalledWith('/some/path');
        });

        it('isCloudIdentityAvailable normalises a native null to undefined', async () => {
            native.isCloudIdentityAvailable.mockResolvedValue(null);
            const result = await binding.isCloudIdentityAvailable();
            expect(result).toBeUndefined();
        });

        it('isCloudIdentityAvailable preserves a real false result', async () => {
            native.isCloudIdentityAvailable.mockResolvedValue(false);
            const result = await binding.isCloudIdentityAvailable();
            expect(result).toBe(false);
        });

        it('isCloudIdentityAvailable preserves a real true result', async () => {
            native.isCloudIdentityAvailable.mockResolvedValue(true);
            const result = await binding.isCloudIdentityAvailable();
            expect(result).toBe(true);
        });
    });

    describe('private app storage', () => {
        it('getPrivateDir delegates with the given name', async () => {
            native.getPrivateDir.mockResolvedValue('/app/Library/Application Support/Incyclist/previews');

            const result = await binding.getPrivateDir('previews');

            expect(native.getPrivateDir).toHaveBeenCalledWith('previews');
            expect(result).toBe('/app/Library/Application Support/Incyclist/previews');
        });

        it('copyFile delegates with source and target', async () => {
            native.copyFile.mockResolvedValue(undefined);

            await binding.copyFile('/source/path', '/target/path');

            expect(native.copyFile).toHaveBeenCalledWith('/source/path', '/target/path');
        });
    });
});
