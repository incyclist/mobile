import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { LandingView } from './LandingView';

const meta: Meta<typeof LandingView> = {
    title: 'Components/RouteImportDialog/Views/LandingView',
    component: LandingView,
    args: {
        compact: false,
        onAddGpx: fn(),
        onAddVideoRoute: fn(),
        onSelectFolder: fn(),
        onUseRouteSharing: undefined,
        showVideoRouteOption: false,
    },
};

export default meta;

type Story = StoryObj<typeof LandingView>;

export const Default: Story = {
    args: {
        compact: false,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
    },
};

export const VideoRouteEnabled: Story = {
    args: {
        compact: false,
        showVideoRouteOption: true,
    },
};

export const WithRouteSharingLink: Story = {
    args: {
        compact: false,
        onUseRouteSharing: fn(),
    },
};

export const CompactWithRouteSharingLink: Story = {
    args: {
        compact: true,
        onUseRouteSharing: fn(),
    },
};
