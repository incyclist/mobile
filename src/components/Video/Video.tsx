import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
    OnLoadData, 
    OnSeekData, 
    OnVideoErrorData, 
    OnProgressData, 
    OnBufferData 
} from 'react-native-video';
import { useUnmountEffect } from '../../hooks';
import { VideoProps, VideoPlaybackEvent, VideoMediaError } from './types';
import { VideoView } from './VideoView';
import { sleep } from '../../utils/timers';
import { Platform } from 'react-native';
import { getFileSystemBinding } from 'src/bindings/fs';

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
        if (time === null || time === undefined || Number.isNaN(time) || !Number.isFinite(time)) {
            return;
        }
        refVideo.current?.seek(time);
    }, []);

    const handleLoad = useCallback((_data: OnLoadData) => {
        if (!startTime) {
            refBootstrapSeek.current = true;
            seekTo(0.1);
        } else {
            seekTo(startTime);
        }        

        refInfo.current.loading = true
        refInfo.current.loaded = false
       
    }, [seekTo, startTime]);

    const handleSeek = useCallback((data: OnSeekData) => {
        if (refBootstrapSeek.current) {
            refBootstrapSeek.current = false;
            seekTo(0);  // seek back to actual start
            return;     // wait for the next onSeek
        }

        const done = ()=> {

            if (!refInfo.current.loading)
                return;

            refInfo.current.loading = false
            refInfo.current.loaded = true
            // internalHidden=false is safe here — VideoView receives (hidden || internalHidden)
            // so if the hidden prop is true, the component remains invisible regardless        
            setInternalHidden(false);
            onLoaded?.(refInfo.current.bufferedTime);

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


    }, [onLoaded, seekTo, startTime]);

    const handleProgress = useCallback((data: OnProgressData) => {
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
    }, [onPlaybackUpdate]);

    const handleBuffer = useCallback((data: OnBufferData) => {
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
    }, [onWaiting]);

    const handleError = useCallback((error: OnVideoErrorData) => {
        const hasErrorCode = error?.error?.errorCode !== undefined
        const code = hasErrorCode
            ? Number(error.error.errorCode) 
            : undefined;

        const message = error?.error?.errorString ?? error?.error?.localizedDescription;

        const mediaError: VideoMediaError = { code, message };
        
        if (refInfo.current.loading || !refInfo.current.loaded) {
            onLoadError?.(mediaError);
        } else {
            onPlaybackError?.(mediaError);
        }
    }, [onLoadError, onPlaybackError]);

    const handleEnd = useCallback(() => {
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
    }, [loop, onEnded]);

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

    return (
        <VideoView
            src={src}
            rate={rate}
            paused={paused}
            muted={muted}
            loop={loop}
            hidden={hidden || internalHidden}
            width={width}
            height={height}
            videoRef={refVideo}
            onLoad={handleLoad}
            onSeek={handleSeek}
            onError={handleError}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onBuffer={handleBuffer}
        />
    );
};
