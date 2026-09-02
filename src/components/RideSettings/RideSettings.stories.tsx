import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { TRideView, TRideViewOption } from 'incyclist-services';
import { RideSettingsView } from './RideSettingsView';

const meta: Meta<typeof RideSettingsView> = {
    component: RideSettingsView,
    title: 'Components/RideSettings',
    args: {
        rideView: 'sv',
        rideViewOptions: new Map<TRideView, TRideViewOption>([
            ['sv', { label: 'Street View' }],
            ['map', { label: 'Map' }],
            ['sat', { label: 'Satellite View' }],
        ]),
        onClose: fn(),
        onChangeRideView: fn(),
    },
};
export default meta;

type Story = StoryObj<typeof RideSettingsView>;

// All options available (baseline state).
export const Default: Story = {};

// Satellite View is present but disabled, with a message explaining why - the
// 'unavailable' tier from IMapAvailabilityBinding (e.g. Play Services missing).
export const SatelliteDisabledWithMessage: Story = {
    args: {
        rideViewOptions: new Map<TRideView, TRideViewOption>([
            ['sv', { label: 'Street View' }],
            ['map', { label: 'Map' }],
            [
                'sat',
                {
                    label: 'Satellite View',
                    disabled: true,
                    message: 'Install Google Play Services to use this view',
                },
            ],
        ]),
    },
};

// Satellite View is entirely absent from the map (the 'not-supported' tier - e.g.
// an older native binary reached via OTA that has no SatelliteView module at all).
// It is simply not rendered, same as today - no special-case handling needed.
export const SatelliteNotSupported: Story = {
    args: {
        rideViewOptions: new Map<TRideView, TRideViewOption>([
            ['sv', { label: 'Street View' }],
            ['map', { label: 'Map' }],
        ]),
    },
};
