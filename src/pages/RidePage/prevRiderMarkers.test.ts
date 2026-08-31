import { NearbyRiderRowProps, PrevRidesRowProps } from 'incyclist-services';
import { buildNearbyRiderMarkers, buildPrevRiderMarkers } from './prevRiderMarkers';

const row = (overrides: Partial<PrevRidesRowProps> = {}): PrevRidesRowProps => ({
    position: 1,
    label: '12.05.2026',
    timeGap: '-1:24',
    isCurrent: false,
    ...overrides,
});

const nearbyRow = (overrides: Partial<NearbyRiderRowProps> = {}): NearbyRiderRowProps => ({
    isUser: false,
    isPaused: false,
    isCoach: false,
    name: 'Alex Rider',
    distance: { value: 1.0, unit: 'km' },
    diffDistance: { value: 0, unit: 'm' },
    avatar: { shirt: 'blue', helmet: 'red' },
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

    it('excludes rows with a null (not just undefined) position - crashed FreeMapView.toFixed() otherwise', () => {
        const markers = buildPrevRiderMarkers([row({ lat: null as unknown as number, lng: null as unknown as number })]);

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

describe('buildNearbyRiderMarkers', () => {
    it('returns an empty array when rows is undefined', () => {
        expect(buildNearbyRiderMarkers(undefined)).toEqual([]);
    });

    it('excludes the current user row (isUser)', () => {
        const markers = buildNearbyRiderMarkers([
            nearbyRow({ isUser: true, name: 'You', lat: 1, lng: 2 }),
            nearbyRow({ isUser: false, name: 'Alex Rider', lat: 3, lng: 4 }),
        ]);

        expect(markers).toHaveLength(1);
        expect(markers[0].position).toEqual({ lat: 3, lng: 4 });
    });

    it('excludes rows with no live position', () => {
        const markers = buildNearbyRiderMarkers([nearbyRow({ lat: undefined, lng: undefined })]);

        expect(markers).toEqual([]);
    });

    it('excludes rows with a null (not just undefined) position - a rider before their first position update has this shape', () => {
        const markers = buildNearbyRiderMarkers([nearbyRow({ lat: null as unknown as number, lng: null as unknown as number })]);

        expect(markers).toEqual([]);
    });

    it('keys markers by name (no stable id field exists on NearbyRiderRowProps)', () => {
        const markers = buildNearbyRiderMarkers([nearbyRow({ name: 'Jordan Chase', lat: 1, lng: 2 })]);

        expect(markers[0].key).toBe('Jordan Chase');
    });

    it('maps the avatar through avatarToConfig when present, omits it otherwise', () => {
        const withAvatar = buildNearbyRiderMarkers([
            nearbyRow({ lat: 1, lng: 2, avatar: { shirt: 'blue', helmet: 'red' } }),
        ]);
        const withoutAvatar = buildNearbyRiderMarkers([nearbyRow({ lat: 1, lng: 2, avatar: undefined })]);

        expect(withAvatar[0].avatar).toMatchObject({ helmOuter: 'red', shirt: 'blue' });
        expect(withoutAvatar[0].avatar).toBeUndefined();
    });

    it('merges alongside buildPrevRiderMarkers into one array (both features present simultaneously)', () => {
        const prevMarkers = buildPrevRiderMarkers([row({ isCurrent: false, lat: 1, lng: 2, tsStart: 100 })]);
        const nearbyMarkers = buildNearbyRiderMarkers([nearbyRow({ isUser: false, name: 'Alex Rider', lat: 3, lng: 4 })]);
        const merged = [...prevMarkers, ...nearbyMarkers];

        expect(merged).toHaveLength(2);
        expect(merged.map((m) => m.key)).toEqual(['100', 'Alex Rider']);
    });
});
