const mockLogEvent = jest.fn();

jest.mock('gd-eventlog', () => ({
    EventLogger: class {
        logEvent = mockLogEvent;
    },
}));

jest.mock('react-native', () => ({
    NativeModules: {},
    Platform: { OS: 'android' },
}));

import { NativeModules, Platform } from 'react-native';
import { logPreviousProcessExits } from './ExitReasons';

const mockNative = NativeModules as { ExitReason?: any };
const mockPlatform = Platform as { OS: string };

const record = (n: number) => ({
    reason: 'LOW_MEMORY',
    importance: 'CACHED',
    rssKb: 1000 + n,
    pssKb: 900 + n,
    timestamp: 5000 + n,
    description: `desc ${n}`,
});

describe('logPreviousProcessExits', () => {
    beforeEach(() => {
        mockLogEvent.mockClear();
        mockPlatform.OS = 'android';
        mockNative.ExitReason = { getNewExitReasons: jest.fn().mockResolvedValue([]) };
    });

    it('logs one event per record', async () => {
        mockNative.ExitReason.getNewExitReasons.mockResolvedValue([record(1), record(2)]);

        await logPreviousProcessExits();

        expect(mockLogEvent).toHaveBeenCalledTimes(2);
        expect(mockLogEvent).toHaveBeenNthCalledWith(1, {
            message: 'previous process exit',
            exitReason: 'LOW_MEMORY',
            exitImportance: 'CACHED',
            rssKb: 1001,
            pssKb: 901,
            exitTs: 5001,
            exitDescription: 'desc 1',
        });
    });

    it('caps the number of events per start', async () => {
        mockNative.ExitReason.getNewExitReasons.mockResolvedValue(Array.from({ length: 9 }, (_, i) => record(i)));

        await logPreviousProcessExits();
        expect(mockLogEvent).toHaveBeenCalledTimes(5);
    });

    it('truncates long descriptions', async () => {
        mockNative.ExitReason.getNewExitReasons.mockResolvedValue([{ ...record(1), description: 'x'.repeat(500) }]);

        await logPreviousProcessExits();
        expect(mockLogEvent.mock.calls[0][0].exitDescription).toHaveLength(200);
    });

    it('does nothing on iOS', async () => {
        mockPlatform.OS = 'ios';
        await logPreviousProcessExits();
        expect(mockNative.ExitReason.getNewExitReasons).not.toHaveBeenCalled();
        expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('does nothing when the binary has no native module', async () => {
        mockNative.ExitReason = undefined;
        await expect(logPreviousProcessExits()).resolves.toBeUndefined();
        expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('swallows native failures', async () => {
        mockNative.ExitReason.getNewExitReasons.mockRejectedValue(new Error('boom'));
        await expect(logPreviousProcessExits()).resolves.toBeUndefined();
        expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('ignores a malformed result', async () => {
        mockNative.ExitReason.getNewExitReasons.mockResolvedValue({ not: 'an array' });
        await expect(logPreviousProcessExits()).resolves.toBeUndefined();
        expect(mockLogEvent).not.toHaveBeenCalled();
    });
});
