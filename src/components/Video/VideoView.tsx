import React, { memo } from 'react';
import { StyleSheet, View, DimensionValue } from 'react-native';
import RNVideo, { ResizeMode } from 'react-native-video';
import { VideoViewProps } from './types';
import { useWhyDidYouRender } from '../../hooks';

export const VideoView = memo((props: VideoViewProps) => {
    const {
        src,
        rate,
        paused,
        muted,
        loop,
        hidden,
        width,
        height,
        videoRef,
        onLoad,
        onSeek,
        onError,
        onProgress,
        onEnd,
        onBuffer,
    } = props;
    
    useWhyDidYouRender('VideoView',props)

    console.log('# [Video] render', src)
    return (
        <View style={[styles.container, { width: width as DimensionValue, height: height as DimensionValue }, hidden && styles.hidden]}>
            <RNVideo
                source={{ uri: src }}
                ref={videoRef}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                rate={rate}
                paused={paused} 
                muted={muted}
                repeat={loop}
                controls={false}
                playInBackground={false}
                progressUpdateInterval={250}
                preventsDisplaySleepDuringVideoPlayback={true}
                onLoad={onLoad}
                onSeek={onSeek}
                onError={onError}
                onProgress={onProgress}
                onEnd={onEnd}
                onBuffer={onBuffer}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    hidden: {
        opacity: 0,
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});
