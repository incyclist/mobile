import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

export const ResizeMode = {
    COVER: 'cover',
    CONTAIN: 'contain',
    STRETCH: 'stretch',
    NONE: 'none',
};

export type OnLoadData = any;
export type OnSeekData = any;
export type OnVideoErrorData = any;
export type OnProgressData = any;
export type OnBufferData = any;

const Video = (props: any) => {
    const { 
        width, 
        height, 
        hidden, 
        onLoad, 
        onProgress, 
        paused, 
        rate 
    } = props;
    
    const refInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const refTime = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            onLoad?.({
                currentTime: 0,
                duration: 120,
                naturalSize: { width: 1920, height: 1080, orientation: 'landscape' },
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [onLoad]);

    useEffect(() => {
        if (!paused && rate > 0) {
            refInterval.current = setInterval(() => {
                refTime.current += 0.25 * rate;
                onProgress?.({
                    currentTime: refTime.current,
                    playableDuration: refTime.current + 10,
                    seekableDuration: 120,
                });
            }, 250);
        } else {
            if (refInterval.current) {
                clearInterval(refInterval.current);
            }
        }

        return () => {
            if (refInterval.current) {
                clearInterval(refInterval.current);
            }
        };
    }, [paused, rate, onProgress]);

    return (
        <View
            style={{
                width,
                height,
                backgroundColor: 'rgba(0,0,0,0.85)',
                opacity: hidden ? 0 : 1,
            }}
        />

    )
};

export default Video;
