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

const donation = {
    text: "Incyclist is free and stays free. If you'd like to help with server and app-store costs:",
    shortText: 'Incyclist is free and stays free. Like to help with costs?',
    links: [
        { id: 'paypal' as const, label: 'PayPal', url: 'https://www.paypal.com/paypalme/incyclist' },
        { id: 'github-sponsors' as const, label: 'GitHub Sponsors', url: 'https://github.com/sponsors/incyclist' },
    ],
    hideLabel: 'Hide',
};

export const WithDonation: Story = {
    args: {
        isSaved: true,
        donation,
        onDonateClicked: fn(),
        onDonateHidden: fn(),
    },
};

export const WithDonationCompact: Story = {
    args: {
        isSaved: true,
        compact: true,
        donation,
        onDonateClicked: fn(),
        onDonateHidden: fn(),
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