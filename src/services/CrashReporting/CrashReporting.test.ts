// Verifies the fatal-crash path logs and flushes before the platform's default handler runs
// (which is what actually takes the app down), and that this only ever installs on Android -
// the App Store data-safety declaration doesn't cover crash reporting, only Play Store's does.

describe('installCrashReporting', () => {
    let logEvent: jest.Mock;
    let flushLogs: jest.Mock;
    let defaultHandler: jest.Mock;
    let errorUtils: { getGlobalHandler: jest.Mock; setGlobalHandler: jest.Mock };

    const setup = (platformOS: string) => {
        jest.resetModules();

        logEvent = jest.fn();
        flushLogs = jest.fn().mockResolvedValue(undefined);
        defaultHandler = jest.fn();
        errorUtils = {
            getGlobalHandler: jest.fn(() => defaultHandler),
            setGlobalHandler: jest.fn(),
        };
        (global as any).ErrorUtils = errorUtils;

        jest.doMock('react-native', () => ({ Platform: { OS: platformOS } }));
        jest.doMock('gd-eventlog', () => ({
            EventLogger: jest.fn().mockImplementation(() => ({ logEvent })),
        }));
        jest.doMock('../RestLogging', () => ({ flushLogs }));

        const { installCrashReporting } = require('./CrashReporting');
        installCrashReporting();
    };

    afterEach(() => {
        delete (global as any).ErrorUtils;
    });

    it('does not install a handler on iOS', () => {
        setup('ios');

        expect(errorUtils.setGlobalHandler).not.toHaveBeenCalled();
    });

    it('installs a handler on Android', () => {
        setup('android');

        expect(errorUtils.setGlobalHandler).toHaveBeenCalledTimes(1);
    });

    it('logs and flushes before calling the default handler on a fatal error', async () => {
        setup('android');
        const handler = errorUtils.setGlobalHandler.mock.calls[0][0];
        const error = new Error('boom');

        await handler(error, true);

        expect(logEvent).toHaveBeenCalledWith({
            message: 'crash in main window',
            error: 'boom',
            stack: error.stack,
            errorName: 'Error',
            isFatal: true,
        });
        expect(flushLogs).toHaveBeenCalledTimes(1);
        expect(defaultHandler).toHaveBeenCalledWith(error, true);

        // the whole point of the flush is that it completes before the app is handed back
        // to the handler that actually kills the process
        expect(flushLogs.mock.invocationCallOrder[0])
            .toBeLessThan(defaultHandler.mock.invocationCallOrder[0]);
    });

    it('logs without flushing on a non-fatal error', async () => {
        setup('android');
        const handler = errorUtils.setGlobalHandler.mock.calls[0][0];
        const error = new Error('minor');

        await handler(error, false);

        expect(logEvent).toHaveBeenCalledWith({
            message: 'error',
            fn: 'native code',
            error: 'minor',
            stack: error.stack,
        });
        expect(flushLogs).not.toHaveBeenCalled();
        expect(defaultHandler).toHaveBeenCalledWith(error, false);
    });

    it('still calls the default handler if logging/flushing throws', async () => {
        setup('android');
        flushLogs.mockImplementation(() => Promise.reject(new Error('network down')));
        const handler = errorUtils.setGlobalHandler.mock.calls[0][0];
        const error = new Error('boom');

        await handler(error, true);

        expect(defaultHandler).toHaveBeenCalledWith(error, true);
    });
});
