import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ActivityGraphPreview } from './ActivityGraphPreview';
import { colors } from '../../theme/colors';
import ActivityLargeJson from '../../../__tests__/testdata/ActivityLarge.json';
import { ActivityDetailsUI } from 'incyclist-services';

const ActivityLarge = ActivityLargeJson as unknown as ActivityDetailsUI;

const meta: Meta<typeof ActivityGraphPreview> = {
    title: 'Components/ActivityGraphPreview',
    component: ActivityGraphPreview,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
    args: {
        // No callback props on this component, but fn() import is required by rules
    },
};

export default meta;

type Story = StoryObj<typeof ActivityGraphPreview>;

export const Default: Story = {
    args: {
        activity: ActivityLarge,
        ftp: 230,
        width: 350,
        height: 80,
    },
};

export const NoFTP: Story = {
    args: {
        activity: {
            ...ActivityLarge,
            user: ActivityLarge.user
                ? { ...ActivityLarge.user, ftp: undefined }
                : undefined,
        } as ActivityDetailsUI,
        width: 350,
        height: 80,
    },
};

export const NoData: Story = {
    args: {
        activity: undefined,
        width: 350,
        height: 80,
    },
};

const styles = StyleSheet.create({
    decorator: {
        width: 400,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
});