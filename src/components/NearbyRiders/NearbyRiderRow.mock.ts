import { NearbyRiderRowProps } from './types';

// distance/diffDistance/speed are {value,unit} — already unit-converted to the user's display
// preference (km/mi, km/h/mph) by ActiveRidesService, not raw meters/m-per-s. See Correction 2,
// nearby-riders-mobile-design.md §4.

/** A rider ahead of the current user, with full stats. */
export const MOCK_ROW_AHEAD: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Alex Rider',
    distance: { value: 12.4, unit: 'km' },
    diffDistance: { value: 340, unit: 'm' },
    power: 245,
    mpower: 3.1,
    speed: { value: 32.4, unit: 'km/h' },
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
    distance: { value: 11.2, unit: 'km' },
    diffDistance: { value: -820, unit: 'm' },
    power: 198,
    speed: { value: 28.7, unit: 'km/h' },
    avatar: { helmet: 'green', shirt: 'yellow' },
};

/** The current user's own row — no gap value is shown, matching web-ui's RiderInfo. */
export const MOCK_ROW_USER: NearbyRiderRowProps = {
    isUser: true,
    isPaused: false,
    isCoach: false,
    name: 'You',
    distance: { value: 11.5, unit: 'km' },
    diffDistance: { value: 0, unit: 'm' },
    power: 221,
    speed: { value: 29.9, unit: 'km/h' },
    avatar: { helmet: 'orange', shirt: 'skyblue' },
};

/** A paused rider — dimmed with an explicit "PAUSED" indicator. */
export const MOCK_ROW_PAUSED: NearbyRiderRowProps = {
    isUser: false,
    isPaused: true,
    isCoach: false,
    name: 'Sam Rivera',
    distance: { value: 9.8, unit: 'km' },
    diffDistance: { value: -1.7, unit: 'km' },
    power: 0,
    speed: { value: 0, unit: 'km/h' },
    avatar: { helmet: 'grey', shirt: 'brown' },
};

/** A coach (constant-power/speed pacer) entry — rendered like any other rider, with a "COACH"
 *  indicator instead of web-ui's distinct coach avatar (no coach SVG asset exists on mobile yet). */
export const MOCK_ROW_COACH: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: true,
    name: 'Pacer 30 km/h',
    distance: { value: 13.1, unit: 'km' },
    diffDistance: { value: 1.0, unit: 'km' },
    power: 210,
    speed: { value: 30.0, unit: 'km/h' },
    avatar: { helmet: 'black', shirt: 'grey' },
};

/** No power/speed data (e.g. a trainer that isn't reporting power, or a stale entry) — those stat
 *  slots are simply absent, not shown as a dash/placeholder. */
export const MOCK_ROW_NO_STATS: NearbyRiderRowProps = {
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Casey Lane',
    distance: { value: 8.6, unit: 'km' },
    diffDistance: { value: -3.1, unit: 'km' },
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
