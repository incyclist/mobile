import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivitySummaryDialogView } from './ActivitySummaryDialogView';
import { ActivityDetailsUI } from 'incyclist-services';
import ActivityLargeJson from '../../../__tests__/testdata/ActivityLarge.json';

const defaultActivity = ActivityLargeJson as unknown as ActivityDetailsUI;

const meta: Meta<typeof ActivitySummaryDialogView> = {
    title: 'Components/ActivitySummaryDialog',
    component: ActivitySummaryDialogView,
    args: {
        activity: defaultActivity,
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

export const Compact: Story = {
    args: {
        compact: true,
        showMap: true,
    },
};

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