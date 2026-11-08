import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Video, VIDEO_SEEK_TIMEOUT_MS, VIDEO_LOAD_MAX_RETRIES, VIDEO_LOAD_RETRY_DELAY_MS } from './Video';
import { VideoView } from './VideoView';
import { probeVideoSource } from './probeVideoSource';

const mockLogEvent = jest.fn();

jest.mock('../../hooks', () => {
    const { useEffect } = jest.requireActual('react');
    return {
        useLogging: () => ({ logEvent: mockLogEvent }),
        useUnmountEffect: (fn: () => void) => useEffect(() => fn, []),   // eslint-disable-line react-hooks/exhaustive-deps
    };
});

jest.mock('../../bindings/fs', () => ({
    getFileSystemBinding: jest.fn(() => ({ requestAccess: jest.fn(), releaseAccess: jest.fn() })),
}));

jest.mock('./VideoView', () => ({
    VideoView: jest.fn(() => null),
}));

jest.mock('./probeVideoSource', () => ({
    probeVideoSource: jest.fn(() => Promise.resolve({ elapsedMs: 12, status: 206, contentRange: 'bytes 0-1/100' })),
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

describe('Video load retry (iOS, server not correctly configured)', () => {

    const onLoaded = jest.fn();
    const onLoadError = jest.fn();

    const serverMisconfigured = {
        error: { domain: 'AVFoundationErrorDomain', code: -11850, localizedDescription: 'Operation Stopped' },
    };

    const lastViewProps = () => {
        const calls = (VideoView as unknown as jest.Mock).mock.calls;
        return calls[calls.length - 1][0];
    };

    const mount = (src = SRC) => {
        const view = render(<Video src={src} width={100} height={100} onLoaded={onLoaded} onLoadError={onLoadError} />);
        lastViewProps().videoRef.current = { seek: jest.fn() };
        return view;
    };

    const fireError = (data: Record<string, unknown>) => {
        act(() => { lastViewProps().onError(data); });
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        Platform.OS = 'ios';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('does not report the first failure, reloads the player after a short delay', () => {
        mount();
        const keyBefore = lastViewProps().reloadKey;

        fireError(serverMisconfigured);
        expect(onLoadError).not.toHaveBeenCalled();
        expect(lastViewProps().reloadKey).toBe(keyBefore);

        act(() => { jest.advanceTimersByTime(VIDEO_LOAD_RETRY_DELAY_MS); });
        expect(lastViewProps().reloadKey).toBe(keyBefore + 1);
        expect(onLoadError).not.toHaveBeenCalled();
    });

    test('probes the source and logs the answer', async () => {
        mount();
        fireError(serverMisconfigured);
        await act(async () => { await Promise.resolve(); });

        expect(probeVideoSource).toHaveBeenCalledWith(SRC);
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'load retry', attempt: 1, errorCode: -11850 }));
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'load error probe', probeStatus: 206 }));
    });

    test('reports the failure when the retry fails as well', () => {
        mount();
        for (let i = 0; i < VIDEO_LOAD_MAX_RETRIES; i++) {
            fireError(serverMisconfigured);
            act(() => { jest.advanceTimersByTime(VIDEO_LOAD_RETRY_DELAY_MS); });
        }
        expect(onLoadError).not.toHaveBeenCalled();

        fireError(serverMisconfigured);
        expect(onLoadError).toHaveBeenCalledTimes(1);
    });

    test('logs when the retry succeeded', () => {
        mount();
        fireError(serverMisconfigured);
        act(() => { jest.advanceTimersByTime(VIDEO_LOAD_RETRY_DELAY_MS); });

        act(() => { lastViewProps().onLoad({}); });
        act(() => { lastViewProps().onSeek({ currentTime: 0.1 }); });

        expect(onLoaded).toHaveBeenCalledTimes(1);
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'load retry succeeded', attempts: 1 });
    });

    test('does not retry other errors', () => {
        mount();
        fireError({ error: { domain: 'NSURLErrorDomain', code: -1001, localizedDescription: 'The request timed out.' } });

        expect(onLoadError).toHaveBeenCalledTimes(1);
        expect(probeVideoSource).not.toHaveBeenCalled();
    });

    test('does not retry on Android', () => {
        Platform.OS = 'android';
        mount();
        fireError(serverMisconfigured);

        expect(onLoadError).toHaveBeenCalledTimes(1);
    });

    test('does not reload after unmount', () => {
        const { unmount } = mount();
        fireError(serverMisconfigured);
        unmount();

        expect(() => act(() => { jest.advanceTimersByTime(VIDEO_LOAD_RETRY_DELAY_MS * 2); })).not.toThrow();
    });
});
