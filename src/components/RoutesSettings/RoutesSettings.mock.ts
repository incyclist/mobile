import type { RoutesCard } from './types';

export const SERVERS_CARD: RoutesCard = {
    key: 'servers',
    title: 'Route Servers',
    description: 'Collections hosted by other riders and groups',
    icon: 'route',
    summary: { text: '2 servers · 36 routes' },
};

export const SERVERS_CARD_WARNING: RoutesCard = {
    ...SERVERS_CARD,
    summary: { text: "1 server couldn't be reached", warning: true },
};

export const SHARING_CARD: RoutesCard = {
    key: 'sharing',
    title: 'Route Sharing',
    description: 'Ride the videos stored on your computer, over your Wi-Fi.',
    icon: 'monitor',
    summary: { text: 'Home PC connected · 128 routes' },
};

export const SHARING_CARD_NOT_SET_UP: RoutesCard = {
    ...SHARING_CARD,
    summary: { text: 'Not set up' },
};

export const ALL_CARDS: RoutesCard[] = [SERVERS_CARD, SHARING_CARD];
