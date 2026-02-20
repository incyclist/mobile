import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteItemView } from './RouteItemView';

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
        totalDistance: { value: 45, unit: 'km'},
        totalElevation: { value: 1200, unit: 'm'},
        hasVideo: true,
        previewUrl: 'https://placehold.co/400x300/png',
        isNew: true,
        isDemo: false,
        cntActive: 5,
        loaded: true,
    },
};

export const DemoRoute: StoryObj<typeof RouteItemView> = {
    args: {
        id: '2',
        title: 'City Sprint',
        country: 'DE',
        totalDistance: { value: 5, unit: 'km' },
        totalElevation: { value: 20, unit: 'm'},
        hasVideo: false,
        points: [{ lat: 52.52, lng: 13.405, routeDistance: 0, elevation: 10 }],
        isNew: false,
        isDemo: true,
        cntActive: 0,
        loaded: true,
    },
};

export const Loading: StoryObj<typeof RouteItemView> = {
    args: {
        id: '3',
        title: 'Loading Route...',
        loaded: false,
        totalDistance: { value: 0, unit: 'km'},
        totalElevation: { value: 0, unit: 'm' },
        hasVideo: false,
        cntActive: 0,
    },
};