import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { KomootSettings } from './KomootSettings';

const meta: Meta<typeof KomootSettings> = {
    title: 'Components/KomootSettings',
    component: KomootSettings,
    args: {
        onBack: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof KomootSettings>;

export const Default: Story = {};