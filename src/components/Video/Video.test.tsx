import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Video, VIDEO_SEEK_TIMEOUT_MS } from './Video';
import { VideoView } from './VideoView';

jest.mock('../../hooks', () => {
    const { useEffect } = jest.requireActual('react');
    return {
        useLogging: () => ({ logEvent: jest.fn() }),
        useUnmountEffect: (fn: () => void) => useEffect(() => fn, []),   // eslint-disable-line react-hooks/exhaustive-deps
    };
});

jest.mock('../../bindings/fs', () => ({
    getFileSystemBinding: jest.fn(() => ({ requestAccess: jest.fn(), releaseAccess: jest.fn() })),
}));

jest.mock('./VideoView', () => ({
    VideoView: jest.fn(() => null),
}));

const SRC = 'https://example.com/video.mp4';

describe('Video start check', () => {

    const seek = jest.fn();
    const onLoaded = jest.fn();

    const lastViewProps = () => {
        const calls = (VideoView as unknown as jest.Mock).mock.calls;
        return calls[calls.length - 1][0];
    };

    const mount = (props: Record<string, unknown> = {}) => {
        const view = render(<Video src={SRC} width={100} height={100} onLoaded={onLoaded} {...props} />);
        lastViewProps().videoRef.current = { seek };
        return view;
    };

    const fire = (event: 'onLoad' | 'onSeek', data: Record<string, unknown> = {}) => {
        act(() => { lastViewProps()[event](data); });
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('without startTime (bootstrap seek)', () => {

        test('seeks to 0.1 on load', () => {
            mount();
            fire('onLoad');

            expect(seek).toHaveBeenCalledTimes(1);
            expect(seek).toHaveBeenCalledWith(0.1);
        });

        test('is ready as soon as the bootstrap seek is confirmed, without seeking back to 0', () => {
            mount();
            fire('onLoad');
            fire('onSeek', { currentTime: 0.1 });

            expect(onLoaded).toHaveBeenCalledTimes(1);
            expect(seek).toHaveBeenCalledTimes(1);
            expect(seek).not.toHaveBeenCalledWith(0);
        });

        test('does not wait for a second onSeek', () => {
            mount();
            fire('onLoad');
            fire('onSeek', { currentTime: 0.1 });
            act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS * 2); });

            expect(onLoaded).toHaveBeenCalledTimes(1);
        });

        test('is ready after the seek timeout if the seek is never confirmed', () => {
            mount();
            fire('onLoad');

            act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS - 1); });
            expect(onLoaded).not.toHaveBeenCalled();

            act(() => { jest.advanceTimersByTime(1); });
            expect(onLoaded).toHaveBeenCalledTimes(1);
        });

        test('a seek confirmation arriving after the timeout does not complete the start twice', () => {
            mount();
            fire('onLoad');
            act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS); });
            fire('onSeek', { currentTime: 0.1 });

            expect(onLoaded).toHaveBeenCalledTimes(1);
        });
    });

    describe('with startTime (direct seek)', () => {

        test('seeks directly to startTime on load', () => {
            mount({ startTime: 64.5 });
            fire('onLoad');

            expect(seek).toHaveBeenCalledTimes(1);
            expect(seek).toHaveBeenCalledWith(64.5);
        });

        test('is ready after the seek timeout if the seek is never confirmed', () => {
            mount({ startTime: 64.5 });
            fire('onLoad');

            act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS); });

            expect(onLoaded).toHaveBeenCalledTimes(1);
        });

        test('is ready once the seek is confirmed, before the timeout', async () => {
            mount({ startTime: 64.5 });
            fire('onLoad');
            fire('onSeek', { currentTime: 64.5 });
            await act(async () => { jest.advanceTimersByTime(10); });

            expect(onLoaded).toHaveBeenCalledTimes(1);

            act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS * 2); });
            expect(onLoaded).toHaveBeenCalledTimes(1);
        });
    });

    test('no timeout fires after unmount', () => {
        const { unmount } = mount();
        fire('onLoad');
        unmount();

        act(() => { jest.advanceTimersByTime(VIDEO_SEEK_TIMEOUT_MS * 2); });

        expect(onLoaded).not.toHaveBeenCalled();
    });
});
