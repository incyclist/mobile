import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideAgainCheckDialogView } from './RideAgainCheckDialogView';
import {
    MOCK_VIDEO_NOT_DOWNLOADED,
    MOCK_VIDEO_DOWNLOADING,
    MOCK_VIDEO_DOWNLOADING_THIS_RIDE,
    MOCK_VIDEO_WAITING_FOR_NETWORK,
    MOCK_VIDEO_NOT_ENOUGH_STORAGE,
    MOCK_VIDEO_DOWNLOAD_FAILED,
    MOCK_VIDEO_ACCESS_LOST,
    MOCK_VIDEO_ACCESS_TRANSIENT,
    MOCK_VIDEO_NOT_FOUND,
    MOCK_VIDEO_READY_THIS_RIDE,
    MOCK_VIDEO_WITH_CONFIRMATION,
} from './RideAgainCheckDialogView.mock';

const meta: Meta<typeof RideAgainCheckDialogView> = {
    title: 'Components/ActivitiesPage/RideAgainCheckDialog',
    component: RideAgainCheckDialogView,
    args: {
        routeTitle: 'Col de Pennes',
        downloadedWhileOpen: false,
        onClose: fn(),
        onStart: fn(),
        onDownloadPress: fn(),
        onDownloadConfirmed: fn(),
        onDownloadDismissed: fn(),
        onStop: fn(),
        onRetry: fn(),
        onKeepInstead: fn(),
        onConfirmAccess: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RideAgainCheckDialogView>;

export const NotDownloadedTablet: Story = {
    args: { video: MOCK_VIDEO_NOT_DOWNLOADED, compact: false },
};

export const NotDownloadedPhone: Story = {
    args: { video: MOCK_VIDEO_NOT_DOWNLOADED, compact: true },
};

export const DownloadingTablet: Story = {
    args: { video: MOCK_VIDEO_DOWNLOADING, compact: false },
};

export const DownloadingPhone: Story = {
    args: { video: MOCK_VIDEO_DOWNLOADING, compact: true },
};

export const DownloadingForThisRideTablet: Story = {
    args: { video: MOCK_VIDEO_DOWNLOADING_THIS_RIDE, compact: false },
};

export const WaitingForNetworkTablet: Story = {
    args: { video: MOCK_VIDEO_WAITING_FOR_NETWORK, compact: false },
};

export const NotEnoughStorageTablet: Story = {
    args: { video: MOCK_VIDEO_NOT_ENOUGH_STORAGE, compact: false },
};

export const NotEnoughStoragePhone: Story = {
    args: { video: MOCK_VIDEO_NOT_ENOUGH_STORAGE, compact: true },
};

export const DownloadFailedTablet: Story = {
    args: { video: MOCK_VIDEO_DOWNLOAD_FAILED, compact: false },
};

export const AccessNeededTablet: Story = {
    args: { video: MOCK_VIDEO_ACCESS_LOST, compact: false },
};

export const AccessNeededPhone: Story = {
    args: { video: MOCK_VIDEO_ACCESS_LOST, compact: true },
};

export const AccessTransientTablet: Story = {
    args: { video: MOCK_VIDEO_ACCESS_TRANSIENT, compact: false },
};

export const NotFoundTablet: Story = {
    args: { video: MOCK_VIDEO_NOT_FOUND, compact: false },
};

export const ReadyForThisRideTablet: Story = {
    args: { video: MOCK_VIDEO_READY_THIS_RIDE, downloadedWhileOpen: true, compact: false },
};

export const ReadyForThisRidePhone: Story = {
    args: { video: MOCK_VIDEO_READY_THIS_RIDE, downloadedWhileOpen: true, compact: true },
};

export const DownloadConfirmationTablet: Story = {
    args: { video: MOCK_VIDEO_WITH_CONFIRMATION, compact: false },
};

export const DownloadConfirmationPhone: Story = {
    args: { video: MOCK_VIDEO_WITH_CONFIRMATION, compact: true },
};
