import React from 'react';
import { render } from '@testing-library/react-native';
import RNVideo from 'react-native-video';
import { VideoView } from './VideoView';

jest.mock('react-native-video', () => ({
    __esModule: true,
    default: jest.fn(() => null),
    ResizeMode: { COVER: 'cover' },
}));

describe('VideoView', () => {

    const props = {
        src: 'https://example.com/video.mp4',
        rate: 1,
        paused: false,
        muted: true,
        loop: false,
        hidden: false,
        width: 100,
        height: 100,
        videoRef: React.createRef<any>(),
        onLoad: jest.fn(),
        onLoadStart: jest.fn(),
        onSeek: jest.fn(),
        onError: jest.fn(),
        onProgress: jest.fn(),
        onEnd: jest.fn(),
        onBuffer: jest.fn(),
    };

    test('lowers the playback buffer requirement of the native player to 1000ms', () => {
        render(<VideoView {...props} />);

        const rnProps = (RNVideo as unknown as jest.Mock).mock.calls[0][0];
        expect(rnProps.bufferConfig).toEqual({ bufferForPlaybackMs: 1000 });
    });
});
