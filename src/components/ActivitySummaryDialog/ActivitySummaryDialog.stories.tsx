import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivitySummaryDialogView } from './ActivitySummaryDialogView';
import { ActivityDetailsUI } from 'incyclist-services';

const MOCK_ACTIVITY = {
    id: '1',
    title: 'Morning Ride',
    startTime: '2026-03-31T10:00:00Z',
    time: 3600,
    distance: { value: 25.3, unit: 'km' },
    totalElevation: { value: 320, unit: 'm' },
    fileName: 'activity_1.json',
    tcxFileName: 'activity_1.tcx',
    fitFileName: null,
    stats: {
        speed: { avg: 18.5 },
        power: { avg: 180 },
        hrm: { avg: 145 },
        cadence: { avg: 88 },
    },
} as unknown as ActivityDetailsUI;

const meta: Meta<typeof ActivitySummaryDialogView> = {
    title: 'Components/ActivitySummaryDialog',
    component: ActivitySummaryDialogView,
    args: {
        activity: MOCK_ACTIVITY,
        showMap: false,
        showSave: true,
        isSaving: false,
        isSaved: false,
        showDeleteConfirm: false,
        units: { speed: 'km/h', distance: 'km' },
        onSave: fn(),
        onClose: fn(),
        onDelete: fn(),
        onDeleteConfirm: fn(),
        onDeleteCancel: fn(),
        onShareFile: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivitySummaryDialogView>;

export const Default: Story = {};

export const Saving: Story = {
    args: {
        isSaving: true,
    },
};

export const Saved: Story = {
    args: {
        isSaved: true,
    },
};

export const WithMap: Story = {
    args: {
        showMap: true,
    },
};

export const DeleteConfirm: Story = {
    args: {
        showDeleteConfirm: true,
    },
};