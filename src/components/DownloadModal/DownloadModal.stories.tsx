import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { DownloadModalView } from './DownloadModalView';
import { DownloadRowDisplayProps } from './types';

const MOCK_ROWS: DownloadRowDisplayProps[] = [
    { routeId: 'r1', title: 'Laon – Paris', status: 'downloading', pct: 62, speed: '2.1 MB/s', sizeLabel: '3.1 / 5.0 GB' },
    { routeId: 'r2', title: 'Col du Tourmalet', status: 'done' },
    { routeId: 'r3', title: 'Alpe d\'Huez', status: 'failed' },
    { routeId: 'r4', title: 'Mont Ventoux', status: 'required' },
];

const meta: Meta<typeof DownloadModalView> = {
    title: 'Components/DownloadModal',
    component: DownloadModalView,
    args: {
        visible: true,
        rows: MOCK_ROWS,
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

export const SingleDownloading: Story = {
    args: {
        rows: [MOCK_ROWS[0]],
    },
};