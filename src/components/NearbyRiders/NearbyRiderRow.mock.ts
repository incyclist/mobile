import { NearbyRiderRowProps } from './types';

/** A rider ahead of the current user, with full stats. */
export const MOCK_ROW_AHEAD: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Alex Rider',
    distance: 12400,
    diffDistance: 340,
    power: 245,
    mpower: 3.1,
    speed: 32.4,
    avatar: { helmet: 'red', shirt: 'blue' },
    backgroundColor: 'rgba(0,0,0,0.45)',
    textColor: '#FFFFFF',
};

/** A rider behind the current user — negative diffDistance renders with a "-" prefix. */
export const MOCK_ROW_BEHIND: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Jordan Chase',
    distance: 11200,
    diffDistance: -820,
    power: 198,
    speed: 28.7,
    avatar: { helmet: 'green', shirt: 'yellow' },
};

/** The current user's own row — no gap value is shown, matching web-ui's RiderInfo. */
export const MOCK_ROW_USER: NearbyRiderRowProps = {
    isUser: true,
    isPaused: false,
    isCoach: false,
    name: 'You',
    distance: 11540,
    diffDistance: 0,
    power: 221,
    speed: 29.9,
    avatar: { helmet: 'orange', shirt: 'skyblue' },
};

/** A paused rider — dimmed with an explicit "PAUSED" indicator. */
export const MOCK_ROW_PAUSED: NearbyRiderRowProps = {
    isUser: false,
    isPaused: true,
    isCoach: false,
    name: 'Sam Rivera',
    distance: 9800,
    diffDistance: -1740,
    power: 0,
    speed: 0,
    avatar: { helmet: 'grey', shirt: 'brown' },
};

/** A coach (constant-power/speed pacer) entry — rendered like any other rider, with a "COACH"
 *  indicator instead of web-ui's distinct coach avatar (no coach SVG asset exists on mobile yet). */
export const MOCK_ROW_COACH: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: true,
    name: 'Pacer 30 km/h',
    distance: 13100,
    diffDistance: 1040,
    power: 210,
    speed: 30.0,
    avatar: { helmet: 'black', shirt: 'grey' },
};

/** No power/speed data (e.g. a trainer that isn't reporting power, or a stale entry) — those stat
 *  slots are simply absent, not shown as a dash/placeholder. */
export const MOCK_ROW_NO_STATS: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Casey Lane',
    distance: 8600,
    diffDistance: -3080,
    avatar: { helmet: 'violet', shirt: 'lime' },
};

export const MOCK_ROWS: NearbyRiderRowProps[] = [
    MOCK_ROW_AHEAD,
    MOCK_ROW_USER,
    MOCK_ROW_BEHIND,
    MOCK_ROW_COACH,
    MOCK_ROW_PAUSED,
    MOCK_ROW_NO_STATS,
];
