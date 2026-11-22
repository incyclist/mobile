import { colors } from '../../theme';
import { StartContentInfo, StartDeviceInfo, StartPhase, StartReadyInfo } from './types';

export type RowGlyph = 'spinner' | 'check' | 'warning' | 'error' | 'dash' | 'waiting';

export type RowStatus = {
    glyph: RowGlyph;
    text: string;
    color: string;
    /** muted rows (ignored) use a dimmer colour than regular text */
    muted?: boolean;
};

export const MUTED_COLOR = colors.disabled;

export const GLYPH_TEXT: Record<Exclude<RowGlyph, 'spinner'>, string> = {
    check: '✓',
    warning: '▲',
    error: '✕',
    dash: '–',
    waiting: '○',
};

export const AVI_LINE = 'This video has to be prepared before it can play. This can take a minute.';
export const SLOW_LINE = 'This is taking longer than usual.';

export const phaseHeading = (phase: StartPhase, content?: StartContentInfo): string => {
    if (phase === 'devices') return 'Starting devices ...';
    if (phase === 'ready') return 'Ready to ride';
    switch (content?.kind) {
        case 'streetview': return 'Preparing Street View ...';
        case 'video': return content.progress ? 'Preparing video ...' : 'Loading video ...';
        case 'map':
        case 'satellite': return 'Loading map ...';
        default: return 'Starting activity ...';
    }
};

const fallbackStartState = (device: StartDeviceInfo): NonNullable<StartDeviceInfo['startState']> => {
    if (device.status === 'Started') return 'started';
    if (device.status === 'Error') return device.isControl ? 'failed' : 'not-connected';
    return 'starting';
};

export const deviceRowStatus = (device: StartDeviceInfo): RowStatus => {
    const state = device.startState ?? fallbackStartState(device);
    switch (state) {
        case 'started': return { glyph: 'check', text: 'Started', color: colors.success };
        case 'not-connected': return { glyph: 'warning', text: 'Not connected', color: colors.statusDot.amber };
        case 'failed': return { glyph: 'error', text: 'Failed', color: colors.error };
        case 'ignored': return { glyph: 'dash', text: 'Ignored', color: MUTED_COLOR, muted: true };
        case 'uploading': return { glyph: 'spinner', text: device.stateText ?? 'Uploading ...', color: colors.text };
        case 'starting':
        default: {
            const text = device.slow ? 'Still starting ...' : (device.stateText ?? 'Starting ...');
            return { glyph: 'spinner', text, color: colors.text };
        }
    }
};

export const contentRowStatus = (content: StartContentInfo, loadingText?: string): RowStatus => {
    switch (content.state) {
        case 'ready':
            return { glyph: 'check', text: content.kind === 'video' ? 'Started' : 'Loaded', color: colors.success };
        case 'unavailable':
            return { glyph: 'warning', text: 'Unavailable – using Map', color: colors.statusDot.amber };
        case 'failed':
            return { glyph: 'error', text: 'Error', color: colors.error };
        case 'loading': {
            const pct = content.progress?.convertPct;
            if (pct !== undefined) {
                return { glyph: 'spinner', text: `Preparing (${Math.round(Math.min(pct, 99))}%)`, color: colors.text };
            }
            return { glyph: 'spinner', text: loadingText ?? 'Loading ...', color: colors.text };
        }
        case 'waiting':
        default:
            return { glyph: 'waiting', text: 'Waiting', color: colors.text };
    }
};

const sensorCount = (info: StartReadyInfo) => info.pendingSensors.length + info.notConnectedSensors.length;

/** One line slot (devices / content phase): slow > AVI expectation. The ready phase uses the notice instead. */
export const lineSlot = (
    phase: StartPhase,
    slow: boolean | undefined,
    content: StartContentInfo | undefined,
): string | undefined => {
    if (phase === 'ready') return undefined;
    if (slow) return SLOW_LINE;
    if (content?.kind === 'video' && content.progress && content.state !== 'ready') return AVI_LINE;
    return undefined;
};

const effectiveState = (device: StartDeviceInfo) => device.startState ?? fallbackStartState(device);

export const isResolvedDevice = (device: StartDeviceInfo): boolean => effectiveState(device) === 'started';

/** control devices (trainer first), then sensors, each in the original order; resolved vs. open split on top */
export const splitDevices = (devices: StartDeviceInfo[]) => {
    const controls = devices.filter(d => d.isControl);
    const sensors = devices.filter(d => !d.isControl);
    return {
        controls,
        sensors,
        openControls: controls.filter(d => !isResolvedDevice(d)),
        resolvedControls: controls.filter(isResolvedDevice),
        openSensors: sensors.filter(d => !isResolvedDevice(d)),
        resolvedSensors: sensors.filter(isResolvedDevice),
    };
};

// ---- problems first: severity, ratchet rank, ordering -------------------------------------------

export type RankMap = Map<string, number>;

/** not connected 3 > slow 2 > still starting 1; everything else (ignored, started) adds none */
export const severity = (device: StartDeviceInfo): number => {
    switch (effectiveState(device)) {
        case 'not-connected':
        case 'failed': return 3;
        case 'starting': return device.slow ? 2 : 1;
        case 'uploading': return 1;
        default: return 0;
    }
};

/** Raises (never lowers) the rank of every device and returns the rank of the given one. */
const ratchet = (ranks: RankMap, device: StartDeviceInfo): number => {
    const rank = Math.max(ranks.get(device.udid) ?? 0, severity(device));
    ranks.set(device.udid, rank);
    return rank;
};

/**
 * Open sensor rows, worst first. The rank is the highest severity a row has had while the overlay
 * was open (kept in `ranks`), so a Retry or Ignore never moves a row; ties keep pairing order.
 */
export const orderOpenSensors = (sensors: StartDeviceInfo[], ranks: RankMap): StartDeviceInfo[] =>
    sensors
        .map((device, index) => ({ device, index, rank: ratchet(ranks, device) }))
        .sort((a, b) => b.rank - a.rank || a.index - b.index)
        .map(entry => entry.device);

// ---- notice -------------------------------------------------------------------------------------

/** `idle`: info without a spinner (nothing is being waited for) */
export type StartNoticeInfo = { tone: 'warning' | 'info'; title: string; detail?: string; idle?: boolean };

const KIND_BY_CAPABILITY: [string, string][] = [
    ['heartrate', 'Heart rate sensor'],
    ['power', 'Power meter'],
    ['cadence', 'Cadence sensor'],
    ['speed', 'Speed sensor'],
    ['app_control', 'Controller'],
];

/** What kind of device this is, in words a rider knows (first matching capability wins) */
export const deviceKind = (device: Pick<StartDeviceInfo, 'capabilities'> | undefined): string => {
    const caps: string[] = (device?.capabilities as string[] | undefined) ?? [];
    return KIND_BY_CAPABILITY.find(([cap]) => caps.includes(cap))?.[1] ?? 'Sensor';
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const kindList = (kinds: string[]): string => {
    const unique = kinds.filter((kind, i) => kinds.indexOf(kind) === i);
    return unique.map((kind, i) => (i === 0 ? kind : lowerFirst(kind))).join(', ');
};

const outstandingNames = (info: StartReadyInfo, devices: StartDeviceInfo[], ranks?: RankMap): string[] => {
    const names = [...info.notConnectedSensors, ...info.pendingSensors];
    const rankOf = (name: string) => {
        const device = devices.find(d => d.name === name);
        return device ? (ranks?.get(device.udid) ?? severity(device)) : 0;
    };
    return names
        .map((name, index) => ({ name, index, rank: rankOf(name) }))
        .sort((a, b) => b.rank - a.rank || a.index - b.index)
        .map(entry => entry.name);
};

const singleNotice = (info: StartReadyInfo, kind: string, name: string): StartNoticeInfo => {
    if (info.notConnectedSensors.length === 1) {
        return { tone: 'warning', title: `${kind} isn't connected`, detail: `${name} · Tap Retry, or start without it.` };
    }
    return {
        tone: 'info',
        title: `${kind} is still connecting`,
        detail: `${name} · The ride starts when it connects, or start now without it.`,
    };
};

/** The pinned ready-phase summary of everything that is not started yet (mobile only) */
export const startNotice = (
    devices: StartDeviceInfo[],
    info: StartReadyInfo | undefined,
    ranks?: RankMap,
): StartNoticeInfo | undefined => {
    if (!info) return undefined;
    const count = sensorCount(info);
    if (count === 0) {
        return info.viewFallback
            ? { tone: 'info', title: "Street View isn't available right now", detail: "You'll ride with the Map.", idle: true }
            : undefined;
    }

    const names = outstandingNames(info, devices, ranks);
    const kinds = names.map(name => deviceKind(devices.find(d => d.name === name)));
    if (count === 1) return singleNotice(info, kinds[0], names[0]);

    const tone = info.notConnectedSensors.length > 0 ? 'warning' : 'info';
    const title = tone === 'warning' ? `${count} sensors aren't connected yet` : `${count} sensors are still connecting`;
    return { tone, title, detail: `${kindList(kinds)} · You can start without them.` };
};

// ---- footer summary ------------------------------------------------------------------------------

const MAX_SUMMARY_NAMES = 3;

/** `✓ KICKR CORE · Map`; more than 3 names: the first 2 and `+N`. Undefined when nothing is resolved. */
export const resolvedSummary = (
    controls: StartDeviceInfo[],
    content: StartContentInfo | undefined,
    sensors: StartDeviceInfo[],
): string | undefined => {
    const names = [
        ...controls.map(d => d.name),
        ...(content?.state === 'ready' ? [content.label] : []),
        ...sensors.map(d => d.name),
    ];
    if (names.length === 0) return undefined;
    if (names.length <= MAX_SUMMARY_NAMES) return `✓ ${names.join(' · ')}`;
    return `✓ ${names.slice(0, 2).join(' · ')} +${names.length - 2}`;
};

/** The "Optional" divider separates blocking rows from sensor rows; on a phone in `ready` every row is optional */
export const showOptionalDivider = (
    collapseResolved: boolean,
    phase: StartPhase | undefined,
    blockingRows: number,
    sensorRows: number,
): boolean => {
    if (sensorRows === 0) return false;
    if (!collapseResolved) return true;
    return phase !== 'ready' && blockingRows > 0;
};
