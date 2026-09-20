import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteItemView } from './RouteItemView';

// Import real route data
import teideRoute from '../../../__tests__/testdata/ES_Teide.json';
import sydneyRoute from '../../../__tests__/testdata/sydney.json';

const meta: Meta<typeof RouteItemView> = {
    title: 'Components/RouteItem',
    component: RouteItemView,
    args: {
        onDelete: fn(),
        onSelect: fn(),
    },
};

export default meta;

export const Default: StoryObj<typeof RouteItemView> = {
    args: {
        id: '1',
        title: 'Alpine Classic Pass',
        country: 'CH',
        totalDistance: { value: 45, unit: 'km' },
        totalElevation: { value: 1200, unit: 'm' },
        hasVideo: true,
        previewUrl: 'https://placehold.co/400x300/png',
        isNew: true,
        isDemo: false,
        cntActive: 5,
        loaded: true,
    },
};

export const WithElevationTeide: StoryObj<typeof RouteItemView> = {
    args: {
        id: '4',
        title: 'Mount Teide Climb',
        country: 'ES',
        totalDistance: { value: 67.6, unit: 'km' },
        totalElevation: { value: 1800, unit: 'm' },
        points: teideRoute.points as any,
        hasVideo: false,
        isNew: false,
        isDemo: false,
        loaded: true,
    },
};

export const WithElevationSydney: StoryObj<typeof RouteItemView> = {
    args: {
        id: '5',
        title: 'Sydney Centennial Park',
        country: 'AU',
        totalDistance: { value: 21, unit: 'km' },
        totalElevation: { value: 300, unit: 'm' },
        points: sydneyRoute.points as any,
        isLoop: true,
        hasVideo: false,
        isNew: true,
        isDemo: false,
        loaded: true,
    },
};

export const DemoRoute: StoryObj<typeof RouteItemView> = {
    args: {
        id: '2',
        title: 'City Sprint',
        country: 'DE',
        totalDistance: { value: 5, unit: 'km' },
        totalElevation: { value: 20, unit: 'm' },
        hasVideo: false,
        isNew: false,
        isDemo: true,
        cntActive: 0,
        loaded: true,
        // Removed single point to allow clean placeholder rendering as per instructions
    },
};

export const Loading: StoryObj<typeof RouteItemView> = {
    args: {
        id: '3',
        title: 'Loading Route...',
        loaded: false,
        totalDistance: { value: 0, unit: 'km' },
        totalElevation: { value: 0, unit: 'm' },
        hasVideo: false,
        cntActive: 0,
    },
};

export const InICloud: StoryObj<typeof RouteItemView> = {
    args: {
        id: '6',
        title: 'Col de Pennes',
        country: 'FR',
        totalDistance: { value: 12.3, unit: 'km' },
        totalElevation: { value: 320, unit: 'm' },
        hasVideo: true,
        isNew: false,
        isDemo: false,
        loaded: true,
        videoPill: 'in-icloud',
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const InICloudPhone: StoryObj<typeof RouteItemView> = {
    args: InICloud.args,
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};

export const VideoDownloading: StoryObj<typeof RouteItemView> = {
    args: {
        id: '7',
        title: 'Passo Giau',
        country: 'IT',
        totalDistance: { value: 9.6, unit: 'km' },
        totalElevation: { value: 1090, unit: 'm' },
        hasVideo: true,
        isNew: false,
        isDemo: false,
        loaded: true,
        videoPill: 'downloading',
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const VideoDownloadingPhone: StoryObj<typeof RouteItemView> = {
    args: VideoDownloading.args,
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};

export const InICloudWithNewBadge: StoryObj<typeof RouteItemView> = {
    args: {
        ...InICloud.args,
        isNew: true,
        cntActive: 3,
    },
};
