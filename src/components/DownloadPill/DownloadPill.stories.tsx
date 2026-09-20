import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { DownloadPill } from './DownloadPill';

const meta: Meta<typeof DownloadPill> = {
    title: 'Components/DownloadPill',
    component: DownloadPill,
    args: {
        onPress: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof DownloadPill>;

// The count is a plain merge of server + iCloud downloading/waiting rows (RoutesPageService) -
// this component has no notion of which kind contributed to it.
export const OneDownload: Story = {
    args: { activeDownloadCount: 1 },
};

export const MultipleDownloads: Story = {
    args: { activeDownloadCount: 3 },
};

export const Hidden: Story = {
    args: { activeDownloadCount: 0 },
};
