import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ActivityGraph } from './ActivityGraph';
import { ActivityDetailsUI, ActivityLogRecord } from 'incyclist-services';
// Adjust path to testdata/ActivityLarge.json relative to the story file.
// story file: src/components/ActivityGraph/ActivityGraph.stories.tsx
// testdata: __tests__/testdata/ActivityLarge.json
import ActivityLargeJson from '../../../__tests__/testdata/ActivityLarge.json';

// Utility to modify activity data for stories
const removeHeartrateFromActivity = (activity: ActivityDetailsUI): ActivityDetailsUI => {
    if (!activity || !activity.logs) return activity;
    const newLogs: ActivityLogRecord[] = activity.logs.map(log => {
        const newLog = { ...log };
        // Ensure heartrate is removed
        if ('heartrate' in newLog) {
            delete newLog.heartrate;
        }
        return newLog;
    });
    // Deep copy stats and remove hrm if it exists there as well
    const newStats = activity.stats ? { ...activity.stats } : undefined;
    if (newStats && 'hrm' in newStats) {
        delete newStats.hrm;
    }

    return { ...activity, logs: newLogs, stats: newStats };
};


// Cast the imported JSON directly to ActivityDetailsUI
const defaultActivity = ActivityLargeJson as unknown as ActivityDetailsUI;
const activityNoHeartrate = removeHeartrateFromActivity(defaultActivity);


const meta: Meta<typeof ActivityGraph> = {
    component: ActivityGraph,
    title: 'Components/ActivityGraph',
    args: {
        activity: defaultActivity,
        ftp: 230,
        units: { speed: 'km/h', distance: 'km' },
        style: { width: 600, height: 300 }, // Required style for graph dimensions
    },
    // No explicit actions needed here, as the smart component manages its own state and logging.
};

export default meta;

type Story = StoryObj<typeof ActivityGraph>;

export const Default: Story = {
    // Uses default args from meta (activity, ftp=230, units, style)
};

export const NoFTP: Story = {
    args: {
        ftp: undefined, // Override ftp to undefined
    },
};

export const TimeAxis: Story = {
    // xMode is internal state, so we don't set it via args.
    // The user can interact with the component to switch to time axis in Storybook.
    // The prompt specified "identical to Default", meaning no arg overrides for this specific story.
};

export const NoHeartrate: Story = {
    args: {
        activity: activityNoHeartrate,
        ftp: 230,
    },
};

export const NoData: Story = {
    args: {
        activity: undefined, // Pass undefined activity
    },
};