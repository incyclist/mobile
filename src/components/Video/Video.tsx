import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    OnLoadData,
    OnSeekData,
    OnVideoErrorData,
    OnProgressData,
    OnBufferData,
    OnLoadStartData
} from 'react-native-video';
import { useLogging, useUnmountEffect } from '../../hooks';
import { VideoProps, VideoPlaybackEvent, VideoMediaError } from './types';
import { VideoView } from './VideoView';
import { sleep } from '../../utils/timers';
import { Platform } from 'react-native';
import { getFileSystemBinding } from '../../bindings/fs';
import { mapAndroidErrorCode } from './mapAndroidErrorCode';
import { resolveNativeVideoSrc } from './resolveNativeVideoSrc';
import { encodeUriIdempotent } from './encodeUriIdempotent';

/**
 * How long the start check waits for the native player to confirm its initial seek (`onSeek`).
 * The player does not always confirm a seek (e.g. while it is still buffering at the target
 * position); after this time the frame that is currently showing is accepted, rather than
 * blocking the ride start indefinitely.
 */
export const VIDEO_SEEK_TIMEOUT_MS = 300;

export const Video = (props: VideoProps) => {
    const {
        src,
        startTime,
        observer,
        width,
        height,
        muted = true,
        loop = false,
        hidden = false,
        onPlaybackUpdate,
        onLoaded,
        onLoadError,
        onPlaybackError,
        onWaiting,
        onEnded,
    } = props;

    const [internalHidden, setInternalHidden] = useState(true);
    const [paused, setPaused] = useState(false);
    const [rate, setRate] = useState(0);
    const [hasAccess,setHasAccess] = useState( Platform.OS!=='ios' || src.startsWith('http') )

    const refVideo = useRef<any>(null);
    const refInitialized = useRef<boolean>(false);
    const refHidden = useRef(hidden);
    const refBootstrapSeek = useRef(false);
    const refHasGrant = useRef(false)
    const refSeekTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const {logEvent} = useLogging('Video')

    const refInfo = useRef({
        loading: false,
        loaded: false,
        
        playing: false,
        startPlaying: false,
        ended: false,
        currentRate: 0,
        currentTime: 0,
        bufferedTime: 0,
    });

    const handleRateChangeRequest = useCallback((newRate: number) => {
        if (newRate === null || newRate === undefined || Number.isNaN(newRate) || !Number.isFinite(newRate)) {
            return;
        }
        if (newRate === refInfo.current.currentRate) {
            return;
        }

        refInfo.current.currentRate = newRate;
        setRate(newRate);

        if (newRate > 0 && !refHidden.current) {
            setPaused(false);
        } else {
            setPaused(true);
        }
    }, []);

    const seekTo = useCallback((time: number) => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'seekTo',videoTime:time})
        }


        if (time === null || time === undefined || Number.isNaN(time) || !Number.isFinite(time)) {
            return;
        }
        refVideo.current?.seek(time);
    }, [logEvent]);

    const handleLoadStart = useCallback((data: OnLoadStartData) => {
        // Diagnostic only: tells us whether the native player ever attempted to load the source
        // at all (vs. never firing anything), and isNetwork/uri catch a source resolving to a
        // network DataSource when a local file was intended.
        logEvent({message:'load start event', isNetwork:data.isNetwork, type:data.type, uri:data.uri})
    }, [logEvent]);

    const clearSeekTimeout = useCallback(() => {
        if (refSeekTimeout.current) {
            clearTimeout(refSeekTimeout.current);
            refSeekTimeout.current = undefined;
        }
    }, []);

    const done = useCallback(() => {
        clearSeekTimeout();

        if (!refInfo.current.loading)
            return;

        refInfo.current.loading = false
        refInfo.current.loaded = true
        // internalHidden=false is safe here — VideoView receives (hidden || internalHidden)
        // so if the hidden prop is true, the component remains invisible regardless
        setInternalHidden(false);
        onLoaded?.(refInfo.current.bufferedTime);
    }, [clearSeekTimeout, onLoaded]);

    const handleSeekTimeout = useCallback(() => {
        refSeekTimeout.current = undefined;
        if (!refInfo.current.loading)
            return;

        logEvent({message:'seek not confirmed, accepting current frame', timeout:VIDEO_SEEK_TIMEOUT_MS})
        refBootstrapSeek.current = false;
        setPaused(true);
        done();
    }, [done, logEvent]);

    const handleLoad = useCallback((_data: OnLoadData) => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'load event'})
        }


        if (!startTime) {
            refBootstrapSeek.current = true;
            seekTo(0.1);
        } else {
            seekTo(startTime);
        }

        refInfo.current.loading = true
        refInfo.current.loaded = false

        clearSeekTimeout();
        refSeekTimeout.current = setTimeout(handleSeekTimeout, VIDEO_SEEK_TIMEOUT_MS);

    }, [seekTo, startTime, logEvent, clearSeekTimeout, handleSeekTimeout]);

    const handleSeek = useCallback((data: OnSeekData) => {

        if (!refInfo?.current?.loaded)  {
            logEvent({message:'seek event', seekData:data})
        }


        if (refBootstrapSeek.current) {
            // the bootstrap seek (forward from 0, to avoid an initial black frame) is confirmed:
            // being a few frames into the video is within tolerance, so there is no need to seek
            // back to 0 - which would force the player to fetch the start of the file again
            refBootstrapSeek.current = false;
            setPaused(true);
            done();
            return;
        }

        if (refInfo.current.loaded) {
            return;
        }

        setPaused(true);
        if (data.currentTime===(startTime ?? 0)) {
            sleep(5).then(done)
        }
        else {
            seekTo(startTime ?? 0);
            sleep(5).then(done)
        }


    }, [logEvent, done, seekTo, startTime]);

    const handleProgress = useCallback((data: OnProgressData) => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'progress event', progressData:data})
        }


        if (refInfo.current.ended) {
            return;
        }
        if (!refInfo.current.loaded) {
            return;
        }

        const time = data.currentTime;
        refInfo.current.currentTime = time;
        
        const bufferedAhead = Math.max(0, (data.playableDuration ?? 0) - time);
        refInfo.current.bufferedTime = bufferedAhead;
        
        const event: VideoPlaybackEvent = { bufferedTime: bufferedAhead };
        onPlaybackUpdate?.(time, refInfo.current.currentRate, event);
    }, [logEvent, onPlaybackUpdate]);

    const handleBuffer = useCallback((data: OnBufferData) => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'buffer event', bufferData:data})
        }


        if (data.isBuffering) {
            if (!refInfo.current.loaded) {
                return;
            }

            onWaiting?.(
                refInfo.current.currentTime,
                refInfo.current.currentRate,
                refInfo.current.bufferedTime,
                []
            );
        }
    }, [logEvent,onWaiting]);

    const handleError = useCallback((error: OnVideoErrorData) => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'error event', errorData:error})
        }

        const hasErrorCode = error?.error?.errorCode !== undefined
        const rawCode = hasErrorCode
            ? Number(error.error.errorCode)
            : undefined;
        const code = Platform.OS === 'android' && rawCode !== undefined
            ? mapAndroidErrorCode(rawCode)
            : undefined;

        const message = error?.error?.errorString ?? error?.error?.localizedDescription;

        const mediaError: VideoMediaError = { code, message };
        
        if (refInfo.current.loading || !refInfo.current.loaded) {
            onLoadError?.(mediaError);
        } else {
            onPlaybackError?.(mediaError);
        }
    }, [logEvent, onLoadError, onPlaybackError]);

    const handleEnd = useCallback(() => {
        if (!refInfo?.current?.loaded)  {
            logEvent({message:'end event'})
        }


        if (loop) {
            // Video will loop natively via repeat={loop} on RNVideo
            // Reset position tracking but don't stop playback
            refInfo.current.ended = false;
            refInfo.current.currentTime = 0;
            return;
        }


        refInfo.current.ended = true;
        refInfo.current.playing = false;
        refInfo.current.currentRate = 0;
        setPaused(true);
        setRate(0);
        onEnded?.();
    }, [logEvent,loop, onEnded]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        refInfo.current.loading = true;
        refInfo.current.loaded = false;
        refInfo.current.playing = false;
        refInfo.current.ended = false;
        refInfo.current.currentRate = 0;
        refInfo.current.bufferedTime = 0;

        observer
            ?.on('rate-update', handleRateChangeRequest)
            ?.on('time-update', seekTo);


        if (!hasAccess)  {
            getFileSystemBinding().requestAccess(src)
                .then((isGranted) => { 
                    if (isGranted) {
                        setHasAccess(true)
                        refHasGrant.current = true
                    }
                })
        }
    }, [observer, handleRateChangeRequest, seekTo, hasAccess, src]);

    useEffect(() => {
        if (!refInfo.current.loaded) {
            return;
        }
        if (startTime !== undefined && startTime !== null) {
            seekTo(startTime);
        }
    }, [startTime, seekTo]);

    useEffect(() => {
        refHidden.current = hidden || internalHidden;
        if (!hidden && !internalHidden && refInfo.current.currentRate > 0) {
            setPaused(false);
        } else if (hidden) {
            setPaused(true);
        }
    }, [hidden, internalHidden]);

    useUnmountEffect(() => {
        clearSeekTimeout();
        observer
            ?.off('rate-update', handleRateChangeRequest)
            ?.off('time-update', seekTo);
        refInfo.current.currentRate = 0;
        setPaused(true);

        if (refHasGrant.current) {
            getFileSystemBinding().releaseAccess(src)
            refHasGrant.current = false
        }
    });

    if (typeof src !== 'string' || !hasAccess) {
        return false;
    }

    const nativeSrc = resolveNativeVideoSrc(src)
    const cleanSrc =  Platform.OS==='ios' ? encodeUriIdempotent(nativeSrc) : nativeSrc

    return (
        <VideoView
            src={cleanSrc}
            rate={rate}
            paused={paused}
            muted={muted}
            loop={loop}
            hidden={hidden || internalHidden}
            width={width}
            height={height}
            videoRef={refVideo}
            onLoad={handleLoad}
            onLoadStart={handleLoadStart}
            onSeek={handleSeek}
            onError={handleError}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onBuffer={handleBuffer}
        />
    );
};
