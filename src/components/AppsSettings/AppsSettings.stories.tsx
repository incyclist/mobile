import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { fn } from 'storybook/test'
import { AppsSettingsView } from './AppsSettingsView'
import type { AppsSettingsViewProps } from './types'

const meta: Meta<typeof AppsSettingsView> = {
    title: 'Components/AppsSettings',
    component: AppsSettingsView,
    args: {
        onSelect: fn(),
    },
}

export default meta

type Story = StoryObj<typeof AppsSettingsView>

const STRAVA_APP = {
    name: 'Strava',
    key: 'strava',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg',
    isConnected: true,
}

const KOMOOT_APP = {
    name: 'Komoot',
    key: 'komoot',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Komoot_logo.svg',
    isConnected: false,
}

const INTERVALS_APP = {
    name: 'Intervals.icu',
    key: 'intervals',
    iconUrl: 'https://example.com/intervals.png',
    isConnected: true,
}

const VELOHERO_APP = {
    name: 'Velohero',
    key: 'velohero',
    iconUrl: 'https://example.com/velohero.png',
    isConnected: false,
}

const defaultArgs: AppsSettingsViewProps = {
    apps: [STRAVA_APP, KOMOOT_APP, INTERVALS_APP, VELOHERO_APP],
    onSelect: fn(),
    compact: false,
}

export const Default: Story = {
    args: defaultArgs,
}

export const Compact: Story = {
    args: {
        ...defaultArgs,
        compact: true,
    },
}

export const AllConnected: Story = {
    args: {
        apps: [
            { ...STRAVA_APP, isConnected: true },
            { ...KOMOOT_APP, isConnected: true },
            { ...INTERVALS_APP, isConnected: true },
            { ...VELOHERO_APP, isConnected: true },
        ],
        onSelect: fn(),
    },
}

export const Empty: Story = {
    args: {
        apps: [],
        onSelect: fn(),
    },
}