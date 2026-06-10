import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideSettingsView } from './RideSettingsView';

const meta: Meta<typeof RideSettingsView> = {
    component: RideSettingsView,
    title: 'Components/RideSettings',
    args: {
        rideView: 'sv',
        rideViewOptions: new Map([
            ['sv', 'Street View'],
            ['map', 'Map'],
            ['sat', 'Satellite View'],
        ]),
        onClose: fn(),
        onChangeRideView: fn(),
    },
};
export default meta;

export const Default: StoryObj<typeof RideSettingsView> = {};