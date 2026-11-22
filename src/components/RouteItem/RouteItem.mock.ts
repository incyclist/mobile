import { RouteItemProps, Unit } from 'incyclist-services';

// RouteItemView (and its tests/stories) only ever reads the fields destructured in
// RouteItemViewProps - the rest of SummaryCardDisplayProps (observer, ready, state, ...) is
// runtime page-service bookkeeping this pure view never touches, so fixtures only need to look
// like a RouteItemProps, matching the cast RouteItem.stories.tsx already uses for the same reason.
const BASE = {
    id: 'route-1',
    title: 'Col de Pennes',
    country: 'FR',
    totalDistance: { value: 12.3, unit: 'km' as Unit },
    totalElevation: { value: 320, unit: 'm' as Unit },
    hasVideo: true,
    isNew: false,
    isDemo: false,
    cntActive: 0,
    loaded: true,
};

/** A route whose video is stored in iCloud and not yet downloaded. */
export const ROUTE_ITEM_IN_ICLOUD = {
    ...BASE,
    id: 'route-icloud',
    title: 'Col de Pennes',
    videoPill: 'in-icloud',
} as unknown as RouteItemProps;

/** A route whose video is currently downloading. */
export const ROUTE_ITEM_DOWNLOADING = {
    ...BASE,
    id: 'route-downloading',
    title: 'Passo Giau',
    videoPill: 'downloading',
} as unknown as RouteItemProps;

/** A route whose video is already local - no pill. */
export const ROUTE_ITEM_NO_PILL = {
    ...BASE,
    id: 'route-local',
    title: "Alpe d'Huez",
} as unknown as RouteItemProps;

/** A route that a computer shares and that plays from it right now. */
export const ROUTE_ITEM_FROM_LINK = {
    ...BASE,
    id: 'route-from-link',
    title: 'Stelvio Pass',
    linkShared: true,
    availability: 'fromLink',
    sourceLabel: 'Den PC',
    thumbnailLink: { linkId: 'link-1', thumbHandle: 'thumb-1' },
} as unknown as RouteItemProps;

/** A route that needs a computer that can not be reached right now. */
export const ROUTE_ITEM_UNAVAILABLE = {
    ...BASE,
    id: 'route-unavailable',
    title: 'Mont Ventoux',
    linkShared: true,
    availability: 'unavailable',
    unavailableReason: 'linkUnreachable',
    sourceLabel: 'Den PC',
    thumbnailLink: { linkId: 'link-1', thumbHandle: 'thumb-2' },
} as unknown as RouteItemProps;

/** A route that a computer shares and that is also on this device. */
export const ROUTE_ITEM_LOCAL_COPY = {
    ...BASE,
    id: 'route-local-copy',
    title: 'Passo Stelvio',
    linkShared: true,
    availability: 'local',
} as unknown as RouteItemProps;

/** The same route as it would arrive 2000 times in a big library; `n` makes the ids unique. */
export const buildRouteItems = (count: number, unavailableEvery = 0): RouteItemProps[] =>
    Array.from({ length: count }, (_, n) => {
        const unavailable = unavailableEvery > 0 && n % unavailableEvery === 0;
        return {
            ...BASE,
            id: `route-${n}`,
            title: `Route ${n}`,
            ...(unavailable
                ? { linkShared: true, availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' }
                : { availability: 'local' }),
        } as unknown as RouteItemProps;
    });
