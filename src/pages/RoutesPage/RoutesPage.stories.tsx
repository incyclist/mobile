import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RoutesPageView } from './View';
import { MainBackground } from '../../components';
import { IObserver, RouteItemProps, Unit } from 'incyclist-services';
import { ALL_ROWS } from '../../components/DownloadModal/DownloadModal.mock';

const generateMockRoutes = (count: number): RouteItemProps[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `route-${i}`,
        title: `Epic Route ${i + 1}`,
        country: i % 2 === 0 ? 'FR' : 'IT',
        totalDistance: { value: 10 + i, unit: 'km', display: `${10 + i} km` },
        totalElevation: { value: 100 + (i * 10), unit: 'm', display: `${100 + (i * 10)} m` },
        hasVideo: i % 3 === 0,
        isLoop: i % 4 === 0,
        isNew: i < 5,
        isDemo: i === 0,
        cntActive: i % 5,
        loaded: true,
        videoPill: i === 1 ? 'in-icloud' : i === 2 ? 'downloading' : undefined,
    })) as unknown as RouteItemProps[];
};

// A static observer: `on(event, handler)` immediately replays the fixed download-update payload,
// so the download pill and Downloads modal render real rows in a story without a running service.
const makeStaticDownloadObserver = (): IObserver => {
    const observer: IObserver = {
        on: (event: string, handler: (data: any) => void) => {
            if (event === 'download-update') {
                handler({
                    rows: ALL_ROWS,
                    count: ALL_ROWS.filter(r => r.status === 'downloading' || r.status === 'waiting').length,
                });
            }
            return observer;
        },
        off: () => observer,
        once: () => observer,
        emit: () => true,
        stop: () => undefined,
    };
    return observer;
};

const mockFilterOptions: {
    countries: string[];
    contentTypes: string[];
    routeTypes: string[];
    routeSources: string[];
    maxDistance: { value: number; unit: Unit };
    maxElevation: { value: number; unit: Unit };
} = {
    countries: ['FR', 'IT', 'DE', 'ES', 'CH', 'AU', 'BE'],
    contentTypes: ['Video', 'GPX'],
    routeTypes: ['Loop', 'Point to Point'],
    routeSources: ['Incyclist', 'Local'],
    maxDistance: { value: 200, unit: 'km' as Unit },
    maxElevation: { value: 5000, unit: 'm' as Unit },
};

const meta: Meta<typeof RoutesPageView> = {
    title: 'Pages/RoutesPage',
    component: RoutesPageView,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={{ flex: 1 }}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
    args: {
        onFilterChanged: fn(),
        onFilterToggle: fn(),
        onImportClicked: fn(),
        onNavigate: fn(),
        filters: {},
        filterOptions: mockFilterOptions,
        downloadObserver: undefined,
        showDownloadModal: false,
        onDownloadPillPress: fn(),
        onDownloadModalClose: fn(),
        onDownloadStop: fn(),
        onDownloadRetry: fn(),
        onDownloadDelete: fn(),
        onDownloadKeepInstead: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RoutesPageView>;

export const Loading: Story = {
    args: {
        loading: true,
        routes: [],
        synchronizing: false,
        filterVisible: false,
        compact: false,
    },
};

export const Empty: Story = {
    args: {
        loading: false,
        routes: [],
        synchronizing: false,
        filterVisible: false,
        compact: false,
    },
};

export const WithRoutes: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(20),
        synchronizing: false,
        filterVisible: true,
        compact: false,
    },
};

export const Synchronizing: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(5),
        synchronizing: true,
        filterVisible: false,
        compact: false,
    },
};

export const Compact: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(10),
        synchronizing: false,
        filterVisible: false,
        compact: true,
    },
};

export const WithActiveDownload: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(5),
        synchronizing: false,
        filterVisible: false,
        compact: false,
        downloadObserver: makeStaticDownloadObserver(),
    },
};

export const WithDownloadModal: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(5),
        synchronizing: false,
        filterVisible: false,
        compact: false,
        showDownloadModal: true,
        downloadObserver: makeStaticDownloadObserver(),
    },
};

export const WithDownloadModalPhone: Story = {
    args: {
        loading: false,
        routes: generateMockRoutes(5),
        synchronizing: false,
        filterVisible: false,
        compact: true,
        showDownloadModal: true,
        downloadObserver: makeStaticDownloadObserver(),
    },
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};