import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ActivityGraph } from './ActivityGraph';
import { ActivityDetailsUI } from 'incyclist-services';
import ActivityLarge from '../../../__tests__/testdata/ActivityLarge.json';

const meta: Meta<typeof ActivityGraph> = {
    title: 'Components/ActivityGraph',
    component: ActivityGraph,
    args: {
        style: { width: 600, height: 300 },
    },
};

export default meta;

type Story = StoryObj<typeof ActivityGraph>;

export const Default: Story = {
    args: {
        activity: ActivityLarge as unknown as ActivityDetailsUI,
        ftp: 230,
        showXAxis: true,
        showYAxis: true,
    },
};

export const NoFTP: Story = {
    args: {
        activity: ActivityLarge as unknown as ActivityDetailsUI,
        ftp: undefined,
        showXAxis: true,
        showYAxis: true,
    },
};

export const TimeAxis: Story = {
    args: {
        activity: ActivityLarge as unknown as ActivityDetailsUI,
        ftp: 230,
        showXAxis: true,
        showYAxis: true,
    },
    // The story currently renders identically to Default — xMode is internal state and cannot be set via args. This is acceptable as-is; do not add a new prop to solve it. Leave the story as a visual variant with a comment explaining the limitation, which is already present.
};

export const NoHeartrate: Story = {
    args: {
        activity: {
            ...ActivityLarge,
            logs: ActivityLarge.logs.map(({ heartrate: _hr, ...rest }) => rest),
        } as unknown as ActivityDetailsUI,
        ftp: 230,
        showXAxis: true,
        showYAxis: true,
    },
};

export const NoData: Story = {
    args: {
        activity: undefined,
    },
};