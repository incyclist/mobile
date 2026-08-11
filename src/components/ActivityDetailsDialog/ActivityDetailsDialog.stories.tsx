import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';

const meta: Meta<typeof ActivityDetailsDialogView> = {
    title: 'Components/ActivityDetailsDialog',
    component: ActivityDetailsDialogView,
    args: {
        loading: false,
        showMap: false,
        canStart: true,
        activity: {
            title: 'Morning Ride',
            startTime: new Date().toISOString(),
            distance: 12500,
            time: 3600,
            totalElevation: 245,
            fileName: 'activity.json',
            tcxFileName: 'activity.tcx',
            fitFileName: 'activity.fit',
            stats: {
                speed: { avg: 25.4, min: 0, max: 45.2 },
                power: { avg: 185, min: 0, max: 450, weighted: 210 },
                hrm: { avg: 145, min: 65, max: 180 },
                cadence: { avg: 85, min: 0, max: 110 },
            },
            logs: [],
        } as any,
        uploads: [
            { type: 'Strava', status: 'success', url: 'https://strava.com/activities/1' },
            { type: 'TrainingPeaks', status: 'failed' },
        ],
        units: { speed: 'km/h', distance: 'km', elevation: 'm' } as any,
        attachedWorkout: null,
        comboEnabled: false,
        onClose: fn(),
        onRideAgain: fn(),
        onShareFile: fn(),
        onUpload: fn(),
        onOpenUpload: fn(),
        onClearWorkout: fn(),
        onAddWorkout: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ActivityDetailsDialogView>;

export const Default: Story = {};

export const Loading: Story = {
    args: {
        loading: true,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
    },
};

export const NoMap: Story = {
    args: {
        showMap: false,
    },
};

// workout-mobile-hld-phase2.md §4.2/§9.1 - "Add Workout" button + inline chip, net-new for this
// dialog, gated on comboEnabled AND canStart (a route must exist to attach a workout to).
export const ComboOffNoWorkout: Story = {
    args: {
        canStart: true,
        comboEnabled: false,
        attachedWorkout: null,
    },
};

export const ComboOnNoWorkout: Story = {
    args: {
        canStart: true,
        comboEnabled: true,
        attachedWorkout: null,
    },
};

export const ComboOnWorkoutAttached: Story = {
    args: {
        canStart: true,
        comboEnabled: true,
        attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
    },
};

// Session 3.3 note (workout-mobile-session-plan-phase2.md, 2026-08-11): a workout-only activity
// (no route - Activity.canStart() returns false) must not offer "Add Workout", even with the
// toggle on and a workout attached elsewhere - there is no route to attach it to.
export const WorkoutOnlyActivityNoAddWorkout: Story = {
    args: {
        canStart: false,
        comboEnabled: true,
        attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
    },
};

// Repo-owner review, 2026-08-11 - checking the AttachmentChip's impact on compact mode
// specifically, since it's an extra row above content that's already tight on vertical space.
export const CompactWorkoutAttached: Story = {
    args: {
        compact: true,
        canStart: true,
        comboEnabled: true,
        attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
    },
};