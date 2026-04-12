import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GPXTourPageView } from './View';

import sydneyRoute from '../../../../__tests__/testdata/sydney.json';


const meta: Meta<typeof GPXTourPageView> = {
    component: GPXTourPageView,
    title: 'Pages/GPXTourPage',
    args: {
        onMenuOpen: fn(),
        onMenuClose: fn(),
        onRetryStart: fn(),
        onIgnoreStart: fn(),
        onCancelStart: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof GPXTourPageView>;


export const WithStartOverlay: Story = {
    args: {
        displayProps: {
            rideState: 'Starting',
            rideType: 'GPX',
            menuProps: null,
            startGateProps: null,
            startOverlayProps: {
                mode: 'GPX',
                rideState: 'Starting',
                mapType: 'MapView',
                mapState: 'Loaded',
                devices: [
                    { udid: '1', name: 'Smart Trainer', isControl: true, status: 'Starting', capabilities: ['control'] },
                ],
                readyToStart: false,
               
            },
        },
    },
};

export const ActiveRide: Story = {
    args: {
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'GPX',
            startOverlayProps: null,
            startGateProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            gpx: { rideView:'map' } as any,
        },
    },
};
