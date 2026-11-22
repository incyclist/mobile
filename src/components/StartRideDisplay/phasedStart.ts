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
export const VIEW_FALLBACK_LINE = "Street View isn't available right now. You'll ride with the Map.";

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

export const readyHelperLine = (info: StartReadyInfo | undefined): string | undefined => {
    if (!info) return undefined;
    const count = sensorCount(info);
    if (count === 0) return info.viewFallback ? VIEW_FALLBACK_LINE : undefined;
    if (count > 1) return "Some sensors aren't connected yet. You can start without them.";
    if (info.pendingSensors.length === 1) return `${info.pendingSensors[0]} is still connecting. You can start without it.`;
    return `${info.notConnectedSensors[0]} isn't connected. You can start without it.`;
};

/** One line slot: slow > AVI expectation > ready helper */
export const lineSlot = (
    phase: StartPhase,
    slow: boolean | undefined,
    content: StartContentInfo | undefined,
    readyInfo: StartReadyInfo | undefined,
): string | undefined => {
    if (slow) return SLOW_LINE;
    if (content?.kind === 'video' && content.progress && content.state !== 'ready') return AVI_LINE;
    if (phase === 'ready') return readyHelperLine(readyInfo);
    return undefined;
};

/** control devices (trainer first), then sensors, each in the original order */
export const splitDevices = (devices: StartDeviceInfo[]) => ({
    controls: devices.filter(d => d.isControl),
    sensors: devices.filter(d => !d.isControl),
});
