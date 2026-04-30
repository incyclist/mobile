import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ImportRoutesDialogView } from './ImportRoutesDialogView';

const meta: Meta<typeof ImportRoutesDialogView> = {
    title: 'Components/ImportRoutesDialog',
    component: ImportRoutesDialogView,
    args: {
        compact: false,
        displayProps: {
            phase: 'landing',
            routes: [],
        },
        selectedIds: [],
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
    },
    argTypes: {
        compact: { control: 'boolean' },
        'displayProps.phase': {
            control: 'select',
            options: ['landing', 'scanning', 'parsing', 'selecting', 'ingesting', 'complete', 'result'],
        },
    },
};

export default meta;

type Story = StoryObj<typeof ImportRoutesDialogView>;

export const Landing: Story = {
    args: {
        displayProps: {
            phase: 'landing',
            routes: [],
        },
    },
};

export const Scanning: Story = {
    args: {
        displayProps: {
            phase: 'scanning',
            scanProgress: { scannedFolders: 12 },
            routes: [],
        },
    },
};

export const Parsing: Story = {
    args: {
        displayProps: {
            phase: 'parsing',
            parseProgress: { parsed: 8, total: 15 },
            routes: [
                { label: 'Route 1', distance: 10000, format: 'gpx', importable: true, alreadyImported: false },
                { label: 'Route 2', distance: 5000, format: 'video', importable: true, alreadyImported: false },
            ] as any,
        },
    },
};

export const Selecting: Story = {
    args: {
        displayProps: {
            phase: 'selecting',
            routes: [
                { label: 'Alpine Loop', distance: 25000, format: 'gpx', importable: true, alreadyImported: false },
                { label: 'Coastal Road', distance: 15000, format: 'video', importable: true, alreadyImported: false },
                { label: 'Broken File', distance: 0, format: 'gpx', importable: false, errorReason: 'Corrupt file' },
                { label: 'Existing Route', distance: 12000, format: 'gpx', importable: true, alreadyImported: true },
            ] as any,
        },
        selectedIds: [],
    },
};

export const Ingesting: Story = {
    args: {
        displayProps: {
            phase: 'ingesting',
            ingestProgress: { current: 2, total: 4, currentName: 'Forest Trail' },
            routes: [],
        },
    },
};

export const Complete: Story = {
    args: {
        displayProps: {
            phase: 'complete',
            completionSummary: {
                imported: 3,
                skipped: 1,
                errors: 1,
                failedRoutes: [
                    { name: 'Mountain Pass', reason: 'Access denied' },
                ],
            },
            routes: [],
        },
    },
};

export const ResultSuccess: Story = {
    args: {
        displayProps: {
            phase: 'result',
            resultSuccess: { routeName: 'Evening Ride' },
            routes: [],
        },
    },
};

export const ResultError: Story = {
    args: {
        displayProps: {
            phase: 'result',
            error: 'File is not a valid GPX.',
            routes: [],
        },
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        displayProps: {
            phase: 'selecting',
            routes: [
                { label: 'Route 1', distance: 10000, format: 'gpx', importable: true, alreadyImported: false },
            ] as any,
        },
    },
};