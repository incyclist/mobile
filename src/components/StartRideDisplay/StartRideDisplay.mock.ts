import { StartDeviceInfo } from './types';

export const startDevice = (extra: Partial<StartDeviceInfo> = {}): StartDeviceInfo => ({
    udid: 'dev-1', name: 'Sensor', isControl: false, status: 'Starting', startState: 'starting', capabilities: [],
    ...extra,
});

const trainer = (extra: Partial<StartDeviceInfo> = {}) =>
    startDevice({ udid: 'trainer-1', name: 'KICKR CORE', isControl: true, status: 'Started', startState: 'started', capabilities: ['control'], ...extra });

const bikeControl = (extra: Partial<StartDeviceInfo> = {}) =>
    startDevice({
        udid: 'bike-1', name: 'BikeControl 2161', status: 'Error', startState: 'not-connected',
        canRetry: true, canIgnore: true, capabilities: ['app_control'], ...extra,
    });

const h6m = (extra: Partial<StartDeviceInfo> = {}) =>
    startDevice({
        udid: 'h6m-1', name: 'H6M 58398', startState: 'starting', slow: true,
        canRetry: true, canIgnore: true, capabilities: ['heartrate'], ...extra,
    });

export const startDevices = { trainer, bikeControl, h6m };
