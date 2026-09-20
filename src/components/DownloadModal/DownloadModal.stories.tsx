import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { DownloadModalView } from './DownloadModalView';
import { SERVER_ROWS, ICLOUD_ROWS, ALL_ROWS } from './DownloadModal.mock';

const meta: Meta<typeof DownloadModalView> = {
    title: 'Components/DownloadModal',
    component: DownloadModalView,
    args: {
        visible: true,
        rows: ALL_ROWS,
        onStop: fn(),
        onRetry: fn(),
        onDelete: fn(),
        onKeepInstead: fn(),
        onClose: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof DownloadModalView>;

export const Default: Story = {
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const Empty: Story = {
    args: {
        rows: [],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ServerRowsOnly: Story = {
    args: {
        rows: SERVER_ROWS,
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudRowsOnly: Story = {
    args: {
        rows: ICLOUD_ROWS,
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const TabletAllRows: Story = {
    args: {
        rows: ALL_ROWS,
        compact: false,
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const PhoneAllRows: Story = {
    args: {
        rows: ALL_ROWS,
        compact: true,
    },
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};

export const ICloudDownloading: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-downloading')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudDownloadingPhone: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-downloading')!],
        compact: true,
    },
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};

export const ICloudWaiting: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-waiting')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudDoneKept: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-done-kept')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudDoneForThisRide: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-done-this-ride')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudDoneForThisRidePhone: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-done-this-ride')!],
        compact: true,
    },
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};

export const ICloudFailed: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-failed')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudNotEnoughStorage: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-not-enough-storage')!],
    },
    parameters: { viewport: { defaultViewport: 'ipadAir' } },
};

export const ICloudNotEnoughStoragePhone: Story = {
    args: {
        rows: [ICLOUD_ROWS.find(r => r.routeId === 'ic-not-enough-storage')!],
        compact: true,
    },
    parameters: { viewport: { defaultViewport: 'iphone15Pro' } },
};
