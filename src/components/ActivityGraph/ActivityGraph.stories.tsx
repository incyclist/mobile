import React from 'react';
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
    // The component defaults to distance, but this story shows it can handle state.
    // Since xMode is internal state, we can't easily pass it via props unless 
    // the component supported it. Based on issue, Default arg/setup should verify time.
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