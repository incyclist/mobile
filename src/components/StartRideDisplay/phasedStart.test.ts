import {
    deviceKind, deviceRowStatus, isResolvedDevice, lineSlot, orderOpenSensors, resolvedSummary, rowKind, severity,
    showOptionalDivider, splitDevices, startNotice, RankMap, RECONNECT_LINE,
} from './phasedStart';
import { startDevice, startDevices } from './StartRideDisplay.mock';
import { StartReadyInfo } from './types';

const { trainer, bikeControl, h6m } = startDevices;
const info = (extra: Partial<StartReadyInfo> = {}): StartReadyInfo => ({
    pendingSensors: [], notConnectedSensors: [], viewFallback: false, ...extra,
});

describe('deviceKind', () => {
    it.each([
        [['heartrate'], 'Heart rate sensor'],
        [['power', 'cadence'], 'Power meter'],
        [['cadence', 'speed'], 'Cadence sensor'],
        [['speed'], 'Speed sensor'],
        [['app_control'], 'Controller'],
        [['heartrate', 'app_control'], 'Heart rate sensor'],
        [['control'], 'Sensor'],
        [[], 'Sensor'],
    ])('maps %j to %s', (capabilities, kind) => {
        expect(deviceKind({ capabilities } as never)).toBe(kind);
    });

    it('falls back to Sensor for an unknown device', () => {
        expect(deviceKind(undefined)).toBe('Sensor');
    });
});

describe('rowKind', () => {
    it('names a control device with resistance control a trainer', () => {
        expect(rowKind({ isControl: true, capabilities: ['control', 'power', 'cadence', 'speed'] } as never)).toBe('Trainer');
    });

    it('names a speed or cadence sensor in the control role after what it measures', () => {
        expect(rowKind({ isControl: true, capabilities: ['cadence', 'speed'] } as never)).toBe('Cadence sensor');
        expect(rowKind({ isControl: true, capabilities: ['speed'] } as never)).toBe('Speed sensor');
    });

    it('names a sensor after what it measures', () => {
        expect(rowKind({ isControl: false, capabilities: ['heartrate'] } as never)).toBe('Heart rate sensor');
    });
});

describe('deviceRowStatus', () => {
    it('shows a spinner and Reconnecting while the control device is restarted automatically', () => {
        const status = deviceRowStatus(startDevice({ startState: 'reconnecting', status: 'Starting' } as never));
        expect(status).toEqual(expect.objectContaining({ glyph: 'spinner', text: 'Reconnecting ...' }));
    });

    it('keeps the text short when the restart is slow, the line below the heading carries the rest', () => {
        const status = deviceRowStatus(startDevice({ startState: 'reconnecting', status: 'Starting', slow: true } as never));
        expect(status.text).toBe('Reconnecting ...');
    });

    it('shows the progress of an upload', () => {
        const status = deviceRowStatus(startDevice({ startState: 'uploading', stateText: 'uploading (40%)' } as never));
        expect(status.text).toBe('uploading (40%)');
    });
});

describe('severity', () => {
    it.each([
        [{ startState: 'not-connected' }, 3],
        [{ startState: 'starting', slow: true }, 2],
        [{ startState: 'starting' }, 1],
        [{ startState: 'reconnecting' }, 1],
        [{ startState: 'reconnecting', slow: true }, 2],
        [{ startState: 'uploading' }, 1],
        [{ startState: 'ignored' }, 0],
        [{ startState: 'started' }, 0],
    ])('%j is %d', (extra, expected) => {
        expect(severity(startDevice(extra as never))).toBe(expected);
    });
});

describe('orderOpenSensors', () => {
    const a = startDevice({ udid: 'a' });
    const b = startDevice({ udid: 'b' });
    const c = startDevice({ udid: 'c' });
    const ids = (list: { udid: string }[]) => list.map(d => d.udid);

    it('keeps pairing order for equal severity', () => {
        expect(ids(orderOpenSensors([a, b, c], new Map()))).toEqual(['a', 'b', 'c']);
    });

    it('puts failed before slow before starting', () => {
        const sorted = orderOpenSensors(
            [a, startDevice({ udid: 'b', slow: true }), startDevice({ udid: 'c', startState: 'not-connected' })],
            new Map(),
        );
        expect(ids(sorted)).toEqual(['c', 'b', 'a']);
    });

    it('never lowers a rank: a row stays first after Retry or Ignore', () => {
        const ranks: RankMap = new Map();
        orderOpenSensors([a, startDevice({ udid: 'b', startState: 'not-connected' })], ranks);

        const retried = orderOpenSensors([a, startDevice({ udid: 'b', startState: 'starting' })], ranks);
        expect(ids(retried)).toEqual(['b', 'a']);

        const ignored = orderOpenSensors([a, startDevice({ udid: 'b', startState: 'ignored' })], ranks);
        expect(ids(ignored)).toEqual(['b', 'a']);
    });

    it('lets a sensor rise when it turns slow', () => {
        const ranks: RankMap = new Map();
        orderOpenSensors([a, b], ranks);
        expect(ids(orderOpenSensors([a, startDevice({ udid: 'b', slow: true })], ranks))).toEqual(['b', 'a']);
    });
});

describe('splitDevices', () => {
    it('separates resolved from open', () => {
        const done = h6m({ startState: 'started' });
        const split = splitDevices([trainer(), done, bikeControl()]);
        expect(split.resolvedControls).toHaveLength(1);
        expect(split.openControls).toHaveLength(0);
        expect(split.resolvedSensors).toEqual([done]);
        expect(split.openSensors.map(d => d.udid)).toEqual(['bike-1']);
        expect(isResolvedDevice(done)).toBe(true);
    });

    it('treats ignored as open', () => {
        expect(isResolvedDevice(h6m({ startState: 'ignored' }))).toBe(false);
    });
});

describe('startNotice', () => {
    const devices = [trainer(), h6m(), bikeControl()];

    it('warns for a single failed sensor', () => {
        expect(startNotice(devices, info({ notConnectedSensors: ['BikeControl 2161'] }))).toEqual({
            tone: 'warning',
            title: "Controller isn't connected",
            detail: 'BikeControl 2161 · Tap Retry, or start without it.',
        });
    });

    it('is neutral for a single connecting sensor', () => {
        expect(startNotice(devices, info({ pendingSensors: ['H6M 58398'] }))).toEqual({
            tone: 'info',
            title: 'Heart rate sensor is still connecting',
            detail: 'H6M 58398 · The ride starts when it connects, or start now without it.',
        });
    });

    it('warns for several sensors when at least one failed, kinds in rank order', () => {
        const notice = startNotice(devices, info({ pendingSensors: ['H6M 58398'], notConnectedSensors: ['BikeControl 2161'] }));
        expect(notice).toEqual({
            tone: 'warning',
            title: "2 sensors aren't connected yet",
            detail: 'Controller, heart rate sensor · You can start without them.',
        });
    });

    it('is neutral for several sensors that are all connecting', () => {
        const more = [...devices, startDevice({ udid: 'p', name: 'Power', capabilities: ['power'] })];
        const notice = startNotice(more, info({ pendingSensors: ['H6M 58398', 'Power'] }));
        expect(notice?.tone).toBe('info');
        expect(notice?.title).toBe('2 sensors are still connecting');
        expect(notice?.detail).toBe('Heart rate sensor, power meter · You can start without them.');
    });

    it('lists a kind only once', () => {
        const two = [startDevice({ udid: '1', name: 'A', capabilities: ['heartrate'] }), startDevice({ udid: '2', name: 'B', capabilities: ['heartrate'] })];
        expect(startNotice(two, info({ pendingSensors: ['A', 'B'] }))?.detail).toBe('Heart rate sensor · You can start without them.');
    });

    it('falls back to Sensor for an unknown name', () => {
        expect(startNotice([], info({ pendingSensors: ['X'] }))?.title).toBe('Sensor is still connecting');
    });

    it('explains the Street View fallback', () => {
        expect(startNotice(devices, info({ viewFallback: true }))).toEqual({
            tone: 'info', title: "Street View isn't available right now", detail: "You'll ride with the Map.", idle: true,
        });
    });

    it('has no notice when nothing is outstanding or no info is given', () => {
        expect(startNotice(devices, info())).toBeUndefined();
        expect(startNotice(devices, undefined)).toBeUndefined();
    });
});

describe('resolvedSummary', () => {
    const sensor = (name: string) => startDevice({ udid: name, name, startState: 'started' });
    const map = { kind: 'map', label: 'Map', state: 'ready' } as const;

    it('joins names with a dot', () => {
        expect(resolvedSummary([trainer()], map, [])).toBe('✓ KICKR CORE · Map');
    });

    it('shows up to three names', () => {
        expect(resolvedSummary([trainer()], map, [sensor('HRM')])).toBe('✓ KICKR CORE · Map · HRM');
    });

    it('collapses more than three names to the first two and +N', () => {
        expect(resolvedSummary([trainer()], map, [sensor('A'), sensor('B')])).toBe('✓ KICKR CORE · Map +2');
        expect(resolvedSummary([trainer()], map, [sensor('A'), sensor('B'), sensor('C')])).toBe('✓ KICKR CORE · Map +3');
    });

    it('skips content that is not ready', () => {
        expect(resolvedSummary([trainer()], { ...map, state: 'unavailable' }, [])).toBe('✓ KICKR CORE');
    });

    it('is undefined when nothing is resolved', () => {
        expect(resolvedSummary([], undefined, [])).toBeUndefined();
    });
});

describe('showOptionalDivider', () => {
    it('is hidden without sensor rows', () => {
        expect(showOptionalDivider(false, 'devices', 2, 0)).toBe(false);
    });

    it('is shown on tablet whenever there are sensors', () => {
        expect(showOptionalDivider(false, 'ready', 0, 1)).toBe(true);
    });

    it('is hidden on a phone in the ready phase', () => {
        expect(showOptionalDivider(true, 'ready', 1, 2)).toBe(false);
    });

    it('is shown on a phone only with open blocking rows', () => {
        expect(showOptionalDivider(true, 'content', 1, 2)).toBe(true);
        expect(showOptionalDivider(true, 'content', 0, 2)).toBe(false);
    });
});

describe('lineSlot', () => {
    it('is empty in the ready phase', () => {
        expect(lineSlot('ready', true, undefined)).toBeUndefined();
    });

    it('prefers the reconnect line over the slow line', () => {
        expect(lineSlot('devices', true, undefined, true)).toBe(RECONNECT_LINE);
        expect(lineSlot('devices', false, undefined, true)).toBe(RECONNECT_LINE);
    });

    it('is empty in the ready phase even while reconnecting', () => {
        expect(lineSlot('ready', false, undefined, true)).toBeUndefined();
    });

    it('prefers slow over the AVI line', () => {
        const video = { kind: 'video', label: 'Video', state: 'loading', progress: { convertPct: 1 } } as const;
        expect(lineSlot('content', true, video)).toMatch(/longer than usual/);
        expect(lineSlot('content', false, video)).toMatch(/has to be prepared/);
    });
});
