import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Dynamic, NavigationBar, Video } from '../../components';
import { colors, textSizes } from '../../theme';
import { useUnmountEffect } from '../../hooks';
import type { TNavigationItem, VideoPlaybackEvent } from '../../components';
import { IObserver, Observer } from 'incyclist-services';


interface RidePageViewProps {
    onClick: (item: TNavigationItem) => void;
}

interface TStatusProps  {
 currentTime: number, 
 currentRate: number
 bufferedTime: number,
 statusLines: Array<string>
}

interface PlaybackStatusProps {
    status: TStatusProps
}

const PlaybackStatus = ({ status}: PlaybackStatusProps) => {

    const {currentTime, currentRate,bufferedTime,statusLines=[] } = status

    return(
    <View style={styles.statusSection}>
        <Text style={styles.statusSummary}>
            Time: {currentTime.toFixed(1)}s   Rate: {currentRate}×   Buf: {bufferedTime.toFixed(1)}s
        </Text>        
        {statusLines.map((line, index) => (
            <Text key={index} style={styles.statusLine}>{line}</Text>
        ))}
    </View>
)};

export const VideoDemoView = ({ onClick }: RidePageViewProps) => {
    const [muted, setMuted] = useState(true);

    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false); // Gate for observer initialization
    const [initialized, setInitialized] = useState(false)

    const refStatus = useRef<TStatusProps>({currentTime:0, currentRate:0, bufferedTime:0, statusLines:[]})
    const refStatusUpdateObserver = useRef( new Observer())

    // Initialize observer once on mount
    useEffect(() => {
        if (initialized) {
            return;
        }
        refObserver.current = new Observer();
        setInitialized(true)
    }, [initialized]);

    // Cleanup observer on unmount
    useUnmountEffect(() => {
        refObserver.current?.stop();
        refInitialized.current = false;
    });

    const addStatus = useCallback((line: string) => {
        const prev = refStatus.current.statusLines
        refStatus.current.statusLines = [`${new Date().toISOString()} ${line}`, ...prev].slice(0, 4);

        console.log('# add Status',line)
    }, []);

    const emitRate = useCallback((rate: number) => {
        refStatus.current.currentRate = rate
        refStatusUpdateObserver.current.emit('update', refStatus.current)
        refObserver.current?.emit('rate-update', rate);
    }, []);

    const emitSeek = useCallback((time: number) => {
        refStatus.current.currentTime = time
        refStatusUpdateObserver.current.emit('update', refStatus.current)
        refObserver.current?.emit('time-update', time);
    }, []);

    const handleToggleMute = useCallback(() => {
        setMuted(prev => !prev);
    }, []);

    const renderRateButton = (rate: number, label: string) => (
        <TouchableOpacity
            key={rate}
            style={[styles.button, refStatus.current.currentRate === rate && styles.buttonActive]}
            onPress={() => emitRate(rate)}
        >
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );

    const renderSeekButton = (time: number, label: string) => (
        <TouchableOpacity
            key={time}
            style={styles.button}
            onPress={() => emitSeek(time)}
        >
            <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
    );

    const videoSrc = 'https://www.reallifevideo.eu/stream/DE_Arnbach.mp4';



    const handleLoaded = useCallback((bufferedTime: number) => {
        console.log('# video loaded',bufferedTime)
        addStatus(`loaded buffer=${bufferedTime.toFixed(1)}s`);
    }, [addStatus]);

    const handleLoadError = useCallback((error:any) => {
        console.log('# video load error',error)
        addStatus(`load-error ${error.message ?? error.code}`);
    }, [addStatus]);

    const handlePlaybackError = useCallback((error:any) => {
        console.log('# video playback error',error)
        addStatus(`playback-error ${error.message ?? error.code}`);
    }, [addStatus]);

    const handleStalled = useCallback((time:number, bufferedTime:number) => {
        console.log('# video stalled', time, bufferedTime)
        addStatus(`stalled t=${time.toFixed(1)}s buf=${bufferedTime.toFixed(1)}s`);
    }, [addStatus]);

    const handleWaiting = useCallback((time:number, rate:number, bufferedTime:number) => {
        console.log('# video waiting', time, rate,bufferedTime)
        addStatus(`waiting t=${time.toFixed(1)}s rate=${rate} buf=${bufferedTime.toFixed(1)}s`);
    }, [addStatus]);

    const handleEnded = useCallback(() => {
        console.log('# video ended' )
        addStatus('ended');
    }, [addStatus]);

    const handleProgress  =useCallback( (time:number, rate:number,event: VideoPlaybackEvent)=>{
        console.log('# video progress', time, rate)
        refStatus.current.currentTime = time
        refStatus.current.currentRate = rate
        refStatus.current.bufferedTime = event?.bufferedTime ?? 0
        refStatusUpdateObserver.current.emit('update', refStatus.current)

        // Do NOT add a status line here — fires too frequently
    },[])



    return (
        <View style={styles.fullScreen}>
            {refObserver.current && (
                <View style={styles.videoBackground}>
                    <Video
                        src={videoSrc}
                        startTime={0}
                        observer={refObserver.current}
                        width='100%'
                        height='100%'
                        muted={muted}
                        loop={false}
                        hidden={false}
                        onPlaybackUpdate={handleProgress}
                        onLoaded={handleLoaded}
                        onLoadError={handleLoadError}
                        onPlaybackError={handlePlaybackError}
                        onStalled={handleStalled}
                        onWaiting={handleWaiting}
                        onEnded={handleEnded}
                    />
                </View>
            )}

            <View style={styles.navColumn}>
                <NavigationBar onClick={onClick} />
            </View>

            <View style={styles.controlPanel}>
                <View style={styles.controlRow}>
                    <Text style={styles.controlLabel}>RATE</Text>
                    {renderRateButton(0, '0×')}
                    {renderRateButton(0.5, '0.5×')}
                    {renderRateButton(1, '1×')}
                    {renderRateButton(2, '2×')}
                    {renderRateButton(4, '4×')}
                </View>

                <View style={styles.controlRow}>
                    <Text style={styles.controlLabel}>SEEK</Text>
                    {renderSeekButton(0, '0s')}
                    {renderSeekButton(30, '30s')}
                    {renderSeekButton(60, '60s')}
                    {renderSeekButton(120, '120s')}
                    {renderSeekButton(300, '300s')}
                </View>

                <View style={styles.controlRow}>
                    <Text style={styles.controlLabel}>OPTIONS</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleToggleMute}
                    >
                        <Text style={styles.buttonText}>{muted ? 'UNMUTE' : 'MUTE'}</Text>
                    </TouchableOpacity>
                </View>

                <Dynamic observer={refStatusUpdateObserver.current } event='update' prop='status' >
                    <PlaybackStatus status={ refStatus.current} />
                </Dynamic>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: colors.background, // Fallback background
    },
    videoBackground: {
        ...StyleSheet.absoluteFill,
        zIndex: 0, // Ensure video is behind other overlays
    },
    navColumn: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 150, // Same width as MainPage
        zIndex: 1,
    },
    controlPanel: {
        position: 'absolute',
        bottom: 0,
        left: 150, // Starts after the nav column
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        padding: 12,
        zIndex: 2,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    controlLabel: {
        color: colors.disabled,
        fontSize: textSizes.normalText,
        textTransform: 'uppercase',
        marginRight: 8,
        minWidth: 50,
    },
    button: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonActive: {
        backgroundColor: colors.buttonPrimary,
    },
    buttonText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    statusSection: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    statusSummary: {
        color: colors.buttonPrimary,
        fontSize: textSizes.normalText,
        fontWeight: '700',
        marginBottom: 4,
    },
    statusLine: {
        color: colors.disabled,
        // The task requested fontSize: 10, but theme tokens must be used and
        // modifying src/theme/textSizes.ts is forbidden.
        // Using `normalText` as the smallest available token.
        fontSize: textSizes.normalText,
        fontFamily: Platform.select({
            ios: 'Menlo',
            android: 'monospace',
            default: 'monospace',
        }),
    },
});