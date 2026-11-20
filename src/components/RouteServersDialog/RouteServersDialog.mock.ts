import type {
    KnownServerItem,
    ManualEntryProps,
    RouteServerItem,
    RouteServersSettingsDisplayProps,
} from 'incyclist-services';

export const BUILT_IN: RouteServerItem = {
    key: 'Incyclist',
    name: 'Incyclist',
    isBuiltIn: true,
    status: 'ok',
    statusText: 'Built in',
    canRemove: false,
};

export const SERVER_ALPINE: RouteServerItem = {
    key: 'Alpine Videos',
    name: 'Alpine Videos',
    host: 'videos.alpine-club.example',
    isBuiltIn: false,
    status: 'ok',
    routeCount: 24,
    statusText: '24 routes',
    canRemove: true,
};

export const SERVER_UNREACHABLE: RouteServerItem = {
    key: 'Ride with Jan',
    name: 'Ride with Jan',
    host: 'routes.jan-rides.example',
    isBuiltIn: false,
    status: 'unreachable',
    statusText: "Couldn't be reached last time. Routes you already have still work.",
    canRemove: true,
};

export const SERVER_LOADING: RouteServerItem = {
    key: 'Flanders Classics',
    name: 'Flanders Classics',
    host: 'kassei.example',
    isBuiltIn: false,
    status: 'loading',
    statusText: 'Checking…',
    canRemove: true,
};

export const SERVER_LOCAL: RouteServerItem = {
    key: 'Home NAS',
    name: 'Home NAS',
    host: '192.168.1.20:8080',
    isBuiltIn: false,
    isLocal: true,
    isUnencrypted: true,
    status: 'ok',
    routeCount: 7,
    statusText: '7 routes',
    tag: 'Local · not encrypted',
    canRemove: true,
};

export const KNOWN_AVAILABLE: KnownServerItem = {
    id: 'alpine-video-club',
    name: 'Alpine Videos',
    description: 'Alps & Dolomites, 40+ climbs',
    operator: 'Alpine Video Club',
    state: 'available',
};

export const KNOWN_ADDED: KnownServerItem = {
    id: 'flanders-classics',
    name: 'Flanders Classics',
    description: 'Cobbles and bergs',
    operator: 'VZW Kassei',
    state: 'added',
    routeCount: 12,
};

export const KNOWN_CHECKING: KnownServerItem = {
    id: 'coast-rides',
    name: 'Coast Rides',
    description: 'Atlantic coast, flat and fast',
    operator: 'Coast Riders',
    state: 'checking',
};

export const KNOWN_ERROR: KnownServerItem = {
    id: 'coast-rides',
    name: 'Coast Rides',
    description: 'Atlantic coast, flat and fast',
    operator: 'Coast Riders',
    state: 'error',
    error: "Couldn't reach this address. Check it, and check that you're online.",
};

export const MANUAL_IDLE: ManualEntryProps = {
    url: '',
    name: '',
    nameTouched: false,
    state: 'idle',
    canSubmit: false,
    canCheck: false,
};

const TRUST_NOTE = "Routes come from the server's operator, not from Incyclist. Only add servers you trust.";
const KNOWN_NOTE = 'Listed servers were checked to work with Incyclist. Their content comes from their operators.';

const EMPTY_STATE = {
    title: 'Get more routes from other providers',
    text: 'Some riders and groups host their own routes, mostly videos. Add their route server and its routes appear in your route list automatically.',
};

export const listProps = (
    servers: RouteServerItem[],
    extra: Partial<RouteServersSettingsDisplayProps> = {}
): RouteServersSettingsDisplayProps => ({
    view: 'list',
    origin: 'settings',
    servers: [BUILT_IN, ...servers],
    isEmpty: servers.length === 0,
    ...(servers.length === 0 ? { emptyState: EMPTY_STATE } : {}),
    known: [],
    manual: MANUAL_IDLE,
    trustNote: TRUST_NOTE,
    ...extra,
});

export const addProps = (
    known: KnownServerItem[],
    manual: Partial<ManualEntryProps> = {},
    extra: Partial<RouteServersSettingsDisplayProps> = {}
): RouteServersSettingsDisplayProps => ({
    view: 'add',
    origin: 'settings',
    servers: [BUILT_IN],
    isEmpty: true,
    known,
    manual: { ...MANUAL_IDLE, ...manual },
    trustNote: TRUST_NOTE,
    ...(known.length > 0 ? { knownNote: KNOWN_NOTE } : {}),
    ...extra,
});

export const REMOVE_WITH_ROUTES = {
    key: 'Alpine Videos',
    name: 'Alpine Videos',
    routeCount: 24,
    downloadedCount: 3,
    downloadedSize: '1.2 GB',
    removeRoutes: false,
    title: 'Remove "Alpine Videos"?',
    text: 'You have 24 routes from this server in your route list.',
    keepLabel: 'Keep these routes',
    removeRoutesLabel: 'Remove these routes too, including 3 downloaded videos (1.2 GB)',
    confirmLabel: 'Remove server',
};

export const REMOVE_WITHOUT_ROUTES = {
    key: 'Ride with Jan',
    name: 'Ride with Jan',
    routeCount: 0,
    removeRoutes: false,
    title: 'Remove "Ride with Jan"?',
    confirmLabel: 'Remove',
};
