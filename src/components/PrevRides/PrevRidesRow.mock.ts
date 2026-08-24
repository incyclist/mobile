import { PrevRidesRowProps } from './types';

/** A representative field: leader, a couple of chasers, the current rider, and last place. */
export const MOCK_ROW_LEADER: PrevRidesRowProps = {
    position: 1,
    label: '12.05.2026',
    timeGap: '-1:24',
    distanceGap: '-420 m',
    isCurrent: false,
    avatar: { helmet: 'red', shirt: 'blue' },
    speed: 32.4,
    power: 245,
    heartrate: 158,
};

export const MOCK_ROW_CHASER: PrevRidesRowProps = {
    position: 2,
    label: '03.02.2026',
    timeGap: '-0:31',
    distanceGap: '-95 m',
    isCurrent: false,
    avatar: { helmet: 'green', shirt: 'yellow' },
    speed: 30.1,
    power: 228,
};

export const MOCK_ROW_CURRENT: PrevRidesRowProps = {
    position: 3,
    label: 'You',
    timeGap: '+0:00',
    distanceGap: '+0 m',
    isCurrent: true,
    avatar: { helmet: 'orange', shirt: 'skyblue' },
    speed: 29.6,
    power: 219,
    heartrate: 162,
};

export const MOCK_ROW_LAST: PrevRidesRowProps = {
    position: 6,
    label: '28.11.2025',
    timeGap: '+4:12',
    distanceGap: '+1.8 km',
    isCurrent: false,
    avatar: { helmet: 'grey', shirt: 'brown' },
    speed: 24.3,
    power: 178,
    heartrate: 149,
};

/** No avatar/HR — exercises the "render nothing in that slot" and optional-field paths. */
export const MOCK_ROW_MINIMAL: PrevRidesRowProps = {
    position: 4,
    label: '15.01.2026',
    timeGap: '+1:47',
    isCurrent: false,
    speed: 27.8,
    power: 201,
};

export const MOCK_ROWS: PrevRidesRowProps[] = [
    MOCK_ROW_LEADER,
    MOCK_ROW_CHASER,
    MOCK_ROW_CURRENT,
    MOCK_ROW_MINIMAL,
    MOCK_ROW_LAST,
];
