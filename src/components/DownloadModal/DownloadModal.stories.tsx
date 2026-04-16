import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { DownloadModalView } from './DownloadModalView';

const meta: Meta<typeof DownloadModalView> = {
    title: 'Components/DownloadModal',
    component: DownloadModalView,
    args: {
        visible: true,
        rows: [
            { routeId: 'r1', title: 'Laon – Paris', status: 'downloading', pct: 62 },
            { routeId: 'r2', title: 'Col du Tourmalet', status: 'done' },
            { routeId: 'r3', title: "Alpe d'Huez", status: 'failed' },
            { routeId: 'r4', title: 'Mont Ventoux', status: 'required' },
        ],
        onStop: fn(),
        onRetry: fn(),
        onDelete: fn(),
        onClose: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof DownloadModalView>;

export const Default: Story = {};

export const Empty: Story = {
    args: {
        rows: [],
    },
};