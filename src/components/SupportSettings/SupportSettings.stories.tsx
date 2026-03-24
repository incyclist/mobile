import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { SupportSettingsView } from './SupportSettingsView';
import { SupportSettingsDisplayProps } from 'incyclist-services';

const MOCK_DISPLAY_PROPS: SupportSettingsDisplayProps = {
    uuid: '1b4ff3d2-f602-4cc5-9d7b-a9f9444e5797',
    appVersion: '0.9.14',
    uiVersion: '26.3.6',
    privacyUrl: 'https://incyclist.com/privacy',
    supportUrls: [
        { label: 'Slack', text: 'Incyclist Slack Workspace', url: 'https://slack.incyclist.com' },
        { label: 'Strava', text: 'Incyclist Strava Club', url: 'https://strava.com/clubs/1029407' },
        { label: 'Email', text: 'support@incyclist.com', url: 'mailto:support@incyclist.com' },
    ],
    gitHubUrl: 'https://github.com/incyclist',
    donationUrl: 'https://www.paypal.com/paypalme/incyclist',
};

const meta: Meta<typeof SupportSettingsView> = {
    title: 'Components/Settings/Support',
    component: SupportSettingsView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();
            return (
                <View style={{ width, height }}>
                    <Story />
                </View>
            );
        },
    ],
    args: {
        onClose: fn(),
        onShareUuid: fn(),
        onOpenUrl: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof SupportSettingsView>;

export const Default: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS,
    },
};

export const Loading: Story = {
    args: {
        displayProps: null,
    },
};