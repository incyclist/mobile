import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { VideoView } from './VideoView';

const meta: Meta<typeof VideoView> = {
    title: 'Components/Video',
    component: VideoView,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VideoView>;

const defaultProps = {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    width: 640,
    height: 360,
    videoRef: React.createRef<any>(),
    onLoad: fn(),
    onSeek: fn(),
    onError: fn(),
    onProgress: fn(),
    onEnd: fn(),
    onBuffer: fn(),
};

export const Default: Story = {
    args: {
        ...defaultProps,
        rate: 1,
        paused: false,
        muted: true,
        loop: true,
        hidden: false,
    },
};

export const Paused: Story = {
    args: {
        ...defaultProps,
        rate: 0,
        paused: true,
        muted: true,
        loop: true,
        hidden: false,
    },
};

export const Hidden: Story = {
    args: {
        ...defaultProps,
        rate: 1,
        paused: true,
        muted: true,
        loop: true,
        hidden: true,
    },
};
