import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutImportDialogView } from './WorkoutImportDialogView';

const meta: Meta<typeof WorkoutImportDialogView> = {
    title: 'Components/WorkoutImportDialog',
    component: WorkoutImportDialogView,
    args: {
        compact: false,
        displayProps: {
            phase: 'landing',
            knownGroups: ['My Workouts', 'FTP Builder'],
        },
        title: 'Import Workout',
        buttons: [{ label: 'Cancel', onClick: fn() }],
        onOutsideClick: fn(),
        onSetGroup: fn(),
        onPickFile: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutImportDialogView>;

export const Landing: Story = {
    args: {
        displayProps: {
            phase: 'landing',
            knownGroups: ['My Workouts', 'FTP Builder'],
        },
        title: 'Import Workout',
        buttons: [{ label: 'Cancel', onClick: fn() }],
    },
};

export const Importing: Story = {
    args: {
        displayProps: {
            phase: 'importing',
            knownGroups: ['My Workouts'],
            importing: { fileName: 'sweet-spot-intervals.zwo' },
        },
        title: 'Importing...',
        buttons: [],
    },
};

export const Result: Story = {
    args: {
        displayProps: {
            phase: 'result',
            knownGroups: ['My Workouts', 'FTP Builder'],
            result: { id: 'w-1', workoutName: 'Sweet Spot Intervals', group: 'My Workouts' },
        },
        title: 'Import Result',
        buttons: [{ label: 'Done', onClick: fn(), primary: true }],
    },
};

export const ResultManyGroups: Story = {
    args: {
        displayProps: {
            phase: 'result',
            knownGroups: ['My Workouts', 'FTP Builder', 'VO2 Max', 'Sweet Spot', 'Recovery', 'Climbing Prep'],
            result: { id: 'w-2', workoutName: 'Winter Base Ride', group: 'Sweet Spot' },
        },
        title: 'Import Result',
        buttons: [{ label: 'Done', onClick: fn(), primary: true }],
    },
};

export const Error: Story = {
    args: {
        displayProps: {
            phase: 'error',
            knownGroups: ['My Workouts'],
            error: 'The selected file is not a valid workout.',
        },
        title: 'Import Failed',
        buttons: [
            { label: 'Try Again', onClick: fn(), primary: true },
            { label: 'Cancel', onClick: fn() },
        ],
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        displayProps: {
            phase: 'landing',
            knownGroups: ['My Workouts', 'FTP Builder'],
        },
        title: 'Import Workout',
        buttons: [{ label: 'Cancel', onClick: fn() }],
    },
};

// Phone-size regression check: the status icon must be small enough that the
// collapsed Group field is visible without scrolling, and the Dialog's own
// ScrollView (not an absolute-positioned dropdown, which gets clipped to
// invisible by Dialog's overflow:'hidden' container) must be able to reach
// every group once expanded. GroupPicker uses inline expansion for >5 groups.
export const CompactResult: Story = {
    args: {
        compact: true,
        displayProps: {
            phase: 'result',
            knownGroups: ['My Workouts', 'FTP Builder'],
            result: { id: 'w-1', workoutName: 'Sweet Spot Intervals', group: 'My Workouts' },
        },
        title: 'Import Result',
        buttons: [{ label: 'Done', onClick: fn(), primary: true }],
    },
};

export const CompactResultManyGroups: Story = {
    args: {
        compact: true,
        displayProps: {
            phase: 'result',
            knownGroups: ['My Workouts', 'FTP Builder', 'VO2 Max', 'Sweet Spot', 'Recovery', 'Climbing Prep'],
            result: { id: 'w-2', workoutName: 'Winter Base Ride', group: 'Sweet Spot' },
        },
        title: 'Import Result',
        buttons: [{ label: 'Done', onClick: fn(), primary: true }],
    },
};
