import { EventLogger } from 'gd-eventlog'
import { Platform } from 'react-native'
import { flushLogs } from '../RestLogging'

type ErrorHandler = (error: any, isFatal?: boolean) => void

interface RNErrorUtils {
    getGlobalHandler: () => ErrorHandler
    setGlobalHandler: (handler: ErrorHandler) => void
}

const logger = new EventLogger('CrashReporting')

/**
 * Installs a global handler for uncaught JS errors. Android only - the current App Store
 * data-safety declaration does not cover crash reporting, only the Play Store one does.
 *
 * Fatal errors are logged and force-flushed to the backend before the original (platform
 * default) handler runs, since that handler is what ultimately takes the app down - without
 * the flush, the event would still be sitting in the REST adapter's batch queue when the
 * process dies. Non-fatal errors don't crash the app, so they go through the normal batched
 * pipeline instead.
 */
export const installCrashReporting = (): void => {
    if (Platform.OS !== 'android')
        return

    const errorUtils = (global as any).ErrorUtils as RNErrorUtils | undefined
    if (!errorUtils)
        return

    const defaultHandler = errorUtils.getGlobalHandler()

    errorUtils.setGlobalHandler(async (error: any, isFatal?: boolean) => {
        try {
            if (isFatal) {
                logger.logEvent({
                    message: 'crash in main window',
                    error: error?.message,
                    stack: error?.stack,
                    errorName: error?.name,
                    isFatal: true,
                })
                await flushLogs()
            }
            else {
                logger.logEvent({
                    message: 'error',
                    fn: 'native code',
                    error: error?.message,
                    stack: error?.stack,
                })
            }
        }
        catch (loggingError) {
            // Never let a logging/flush failure surface as an unhandled rejection or stop the
            // platform's own handler from running - it's what actually takes the app down.
            console.warn('CrashReporting: failed to log/flush crash', loggingError)
        }
        finally {
            defaultHandler(error, isFatal)
        }
    })
}
