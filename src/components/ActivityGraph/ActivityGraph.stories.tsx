import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ActivityGraph } from './ActivityGraph';
import ActivityLarge from '../../../__tests__/testdata/ActivityLarge.json';
import { ActivityDetailsUI } from 'incyclist-services';

const activityData = ActivityLarge as unknown as ActivityDetailsUI;

const meta: Meta<typeof ActivityGraph> = {
    title: 'Components/ActivityGraph',
    component: ActivityGraph,
    args: {
        activity: activityData,
        ftp: 230,
        style: { width: 600, height: 300 },
    },
};

export default meta;

type Story = StoryObj<typeof ActivityGraph>;

export const Default: Story = {
    args: {
        ftp: 230,
    },
};

export const NoFTP: Story = {
    args: {
        ftp: undefined,
    },
};

export const TimeAxis: Story = {
    args: {
        ftp: 230,
    },
};

export const NoHeartrate: Story = {
    args: {
        activity: {
            ...activityData,
            logs: activityData.logs.map(log => {
                const newLog = { ...log };
                delete newLog.heartrate;
                return newLog;
            }),
        } as ActivityDetailsUI,
    },
};

export const NoData: Story = {
    args: {
        activity: undefined,
    },
};