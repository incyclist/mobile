import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteImportDialogView } from './RouteImportDialogView';

const meta: Meta<typeof RouteImportDialogView> = {
    title: 'Components/RouteImportDialog',
    component: RouteImportDialogView,
    args: {
        title: 'Import Routes',
        buttons: [],
        onOutsideClick: fn(),
        onAddGpx: fn(),
        onAddVideoRoute: fn(),
        onSelectFolder: fn(),
        onToggleRoute: fn(),
        onSelectAll: fn(),
        onDeselectAll: fn(),
        onConfirmSelection: fn(),
        onDone: fn(),
        onTryAgain: fn(),
        onCancel: fn(),
        selectedIds: [],
        displayProps: {
            phase: 'landing',
        },
    },
};

export default meta;
type Story = StoryObj<typeof RouteImportDialogView>;

export const Landing: Story = {
    args: {
        displayProps: { phase: 'landing' },
    },
};

export const Selecting: Story = {
    args: {
        title: 'Select Routes',
        buttons: [
            { label: 'Import (2)', onClick: fn(), primary: true },
            { label: 'Cancel', onClick: fn() },
        ],
        displayProps: {
            phase: 'selecting',
            routes: [
                { id: '1', title: 'Route 1', distance: 10000 },
                { id: '2', title: 'Route 2', distance: 20000 },
            ],
        },
        selectedIds: ['1', '2'],
    },
};

export const Ingesting: Story = {
    args: {
        title: 'Importing',
        buttons: [{ label: 'Cancel', onClick: fn() }],
        displayProps: {
            phase: 'ingesting',
            progress: 45,
            statusText: 'Processing Route 2 of 5...',
        },
    },
};

export const Success: Story = {
    args: {
        title: 'Success',
        buttons: [{ label: 'Done', onClick: fn(), primary: true }],
        displayProps: {
            phase: 'result',
            resultSuccess: true,
            resultMessage: 'Successfully imported 5 routes.',
        },
    },
};