import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { UploadPill } from './UploadPill';

const meta: Meta<typeof UploadPill> = {
    title: 'Components/UploadPill',
    component: UploadPill,
    args: {
        onSynchronize: fn(),
        onOpen: fn(),
    },
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof UploadPill>;

export const Success: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'success',
        url: 'https://strava.com/activities/123',
    },
};

export const Failed: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'failed',
    },
};

export const Unknown: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'unknown',
    },
};

export const Synchronizing: Story = {
    args: {
        type: 'strava',
        text: 'Strava',
        status: 'unknown',
        synchronizing: true,
    },
};

const styles = StyleSheet.create({
    decorator: {
        padding: 16,
        alignItems: 'flex-start',
    },
});