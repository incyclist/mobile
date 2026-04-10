import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { fn } from 'storybook/test'
import { KomootLoginDialogView } from './KomootLoginDialogView'

const meta: Meta<typeof KomootLoginDialogView> = {
    title: 'Components/KomootLoginDialog',
    component: KomootLoginDialogView,
    args: {
        onUsernameChange: fn(),
        onPasswordChange: fn(),
        onUseridChange: fn(),
        onConnect: fn(),
        onCancel: fn(),
    },
}

export default meta

type Story = StoryObj<typeof KomootLoginDialogView>

export const Default: Story = {
    args: {
        isConnecting: false,
        username: '',
        password: '',
        userid: '',
    },
}

export const Connecting: Story = {
    args: {
        isConnecting: true,
        username: 'user@example.com',
        password: 'secret',
        userid: '12345',
    },
}

export const WithError: Story = {
    args: {
        isConnecting: false,
        username: 'user@example.com',
        password: 'wrongpassword',
        userid: '12345',
        errorMessage: 'Invalid credentials. Please check your details.',
    },
}

export const Compact: Story = {
    args: {
        isConnecting: false,
        compact: true,
        username: '',
        password: '',
        userid: '',
    },
}