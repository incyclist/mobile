import React, { memo } from 'react';
import { StyleSheet, View, DimensionValue } from 'react-native';
import RNVideo, { BufferConfig, ResizeMode } from 'react-native-video';
import { VideoViewProps } from './types';

// Android only. The player default (2500ms) makes a seek take long to be confirmed, as it only
// reports the seek as done once that much data is buffered at the target position.
const BUFFER_CONFIG: BufferConfig = { bufferForPlaybackMs: 1000 };

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
        onLoadStart,
    } = props;
    
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
                bufferConfig={BUFFER_CONFIG}
                preventsDisplaySleepDuringVideoPlayback={true}
                onLoad={onLoad}
                onLoadStart={onLoadStart}
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
