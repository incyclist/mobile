import { AppState } from 'react-native';
import { BaseAdapter, EventLogger } from 'gd-eventlog';
import { flushLogs } from '../RestLogging';
import { navigationRef } from '../Navigation';
import { SessionDiagnostics } from './SessionDiagnostics';
import { SessionSnapshot } from './sessionRecord';
import { getDiagnosticsStore } from './store';

export { markLogDelivered } from './store';

/** Counts every event that passes through the logger, to derive an events-per-second rate. */
class LogRateCounter extends BaseAdapter {
    count = 0;

    log(context: string, event: any): void {
        if (context === undefined || event === undefined)
            return;
        this.count += 1;
    }
}

let diagnostics: SessionDiagnostics | undefined;
let counter: LogRateCounter | undefined;

const getSnapshot = (): SessionSnapshot => {
    let page = '';
    try {
        page = (navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined) ?? '';
    } catch {
        page = '';
    }
    // all ride screens are registered as routes named 'ride...' (rideDeviceOK, rideSimulate, ...)
    return { page, rideState: page.startsWith('ride') ? 'riding' : 'none' };
};

/** Starts the diagnostics once per JS runtime. Never throws. */
export const startSessionDiagnostics = (): void => {
    try {
        if (diagnostics)
            return;

        counter = new LogRateCounter();
        EventLogger.registerAdapter(counter);

        const logger = new EventLogger('SessionDiagnostics');
        diagnostics = new SessionDiagnostics({
            store: getDiagnosticsStore(),
            logEvent: event => logger.logEvent(event),
            flushLogs: () => flushLogs(),
            getAppState: () => AppState.currentState,
            getSnapshot,
            getEventCount: () => counter?.count ?? 0,
        });
        diagnostics.start();
    } catch {
        // diagnostics must never affect startup
    }
};

export const notifySessionAppState = (next: string): void => {
    try {
        diagnostics?.onAppStateChange(next);
    } catch {
        // ignore
    }
};

export const markSessionClean = (): void => {
    try {
        diagnostics?.markClean();
    } catch {
        // ignore
    }
};
