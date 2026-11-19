import { NativeModules, Platform } from 'react-native';
import { EventLogger } from 'gd-eventlog';

const MAX_EVENTS = 5;
const MAX_DESCRIPTION = 200;

interface NativeExitRecord {
    reason: string;
    importance: string;
    rssKb: number;
    pssKb: number;
    timestamp: number;
    description?: string;
}

interface NativeExitReason {
    getNewExitReasons?: () => Promise<NativeExitRecord[]>;
}

/**
 * Logs why earlier processes of the app ended (Android 11+, via ApplicationExitInfo).
 *
 * The native module only returns records it has not handed out before, so every record is
 * reported once. The module is absent on iOS, on Android binaries older than the one that
 * introduced it (a JS-only hot update can reach those), and the native side returns nothing
 * on Android 10 and older - in all of these cases this does nothing. Never throws.
 */
export const logPreviousProcessExits = async (): Promise<void> => {
    try {
        if (Platform.OS !== 'android')
            return;

        const native = NativeModules?.ExitReason as NativeExitReason | undefined;
        if (!native?.getNewExitReasons)
            return;

        const records = await native.getNewExitReasons();
        if (!Array.isArray(records))
            return;

        const logger = new EventLogger('ExitReasons');
        records.slice(0, MAX_EVENTS).forEach(record => {
            logger.logEvent({
                message: 'previous process exit',
                exitReason: record.reason,
                exitImportance: record.importance,
                rssKb: record.rssKb,
                pssKb: record.pssKb,
                exitTs: record.timestamp,
                exitDescription: (record.description ?? '').slice(0, MAX_DESCRIPTION),
            });
        });
    }
    catch {
        // diagnostics must never affect startup
    }
};
