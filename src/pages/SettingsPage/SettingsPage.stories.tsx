import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SettingsPageView } from './View';

const meta: Meta<typeof SettingsPageView> = {
    component: SettingsPageView,
    args: {
        onClose: fn(),
        sections: [
            { label: 'Gear', onPress: fn() },
            { label: 'Ride', onPress: fn() },
            { label: 'Apps', onPress: fn() },
            { label: 'Support', onPress: fn() },
        ],
    },
};

export default meta;

export const Default: StoryObj<typeof SettingsPageView> = {};