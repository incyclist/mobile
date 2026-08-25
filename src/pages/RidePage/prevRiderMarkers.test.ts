import { PrevRidesRowProps } from 'incyclist-services';
import { buildPrevRiderMarkers } from './prevRiderMarkers';

const row = (overrides: Partial<PrevRidesRowProps> = {}): PrevRidesRowProps => ({
    position: 1,
    label: '12.05.2026',
    timeGap: '-1:24',
    isCurrent: false,
    ...overrides,
});

describe('buildPrevRiderMarkers', () => {
    it('returns an empty array when rows is undefined', () => {
        expect(buildPrevRiderMarkers(undefined)).toEqual([]);
    });

    it('excludes the current rider row', () => {
        const markers = buildPrevRiderMarkers([
            row({ isCurrent: true, lat: 1, lng: 2 }),
            row({ isCurrent: false, lat: 3, lng: 4, tsStart: 100 }),
        ]);

        expect(markers).toHaveLength(1);
        expect(markers[0].position).toEqual({ lat: 3, lng: 4 });
    });

    it('excludes rows with no live position', () => {
        const markers = buildPrevRiderMarkers([row({ lat: undefined, lng: undefined })]);

        expect(markers).toEqual([]);
    });

    it('keys markers by tsStart when present, falling back to position', () => {
        const withTs = buildPrevRiderMarkers([row({ lat: 1, lng: 2, tsStart: 555 })]);
        const withoutTs = buildPrevRiderMarkers([row({ lat: 1, lng: 2, position: 7 })]);

        expect(withTs[0].key).toBe('555');
        expect(withoutTs[0].key).toBe('7');
    });

    it('maps the avatar through avatarToConfig when present, omits it otherwise', () => {
        const withAvatar = buildPrevRiderMarkers([
            row({ lat: 1, lng: 2, avatar: { helmet: 'red', shirt: 'blue' } }),
        ]);
        const withoutAvatar = buildPrevRiderMarkers([row({ lat: 1, lng: 2 })]);

        expect(withAvatar[0].avatar).toMatchObject({ helmOuter: 'red', shirt: 'blue' });
        expect(withoutAvatar[0].avatar).toBeUndefined();
    });
});
