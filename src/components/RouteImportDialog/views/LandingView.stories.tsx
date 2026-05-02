import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { LandingView } from './LandingView';

const meta: Meta<typeof LandingView> = {
    title: 'Components/ImportRoutesDialog/LandingView',
    component: LandingView,
    args: {
        compact: false,
        onAddGpx: fn(),
        onAddVideoRoute: fn(),
        onSelectFolder: fn(),
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