import { IObserver } from 'incyclist-services';
import { 
    OnLoadData, 
    OnSeekData, 
    OnVideoErrorData, 
    OnProgressData, 
    OnBufferData 
} from 'react-native-video';

export interface VideoMediaError {
    code?: number;
    message?: string;
}

export interface VideoPlaybackEvent {
    bufferedTime?: number;
}

export interface VideoBufferRange {
    start: number;
    end: number;
}

export interface VideoProps {
    src: string;
    startTime?: number;
    observer?: IObserver;
    width: number | string;
    height: number | string;
    muted?: boolean;           // default true
    loop?: boolean;            // default false
    hidden?: boolean;          // default false
    onPlaybackUpdate?: (time: number, rate: number, event: VideoPlaybackEvent) => void;
    onLoaded?: (bufferedTime: number) => void;
    onLoadError?: (error: VideoMediaError) => void;
    onPlaybackError?: (error: VideoMediaError) => void;
    onStalled?: (time: number, bufferedTime: number, buffers: VideoBufferRange[]) => void;
    onWaiting?: (time: number, rate: number, bufferedTime: number, buffers: VideoBufferRange[]) => void;
    onEnded?: () => void;
}

export interface VideoViewProps {
    src: string;
    rate: number;
    paused: boolean;
    muted: boolean;
    loop: boolean;
    hidden: boolean;
    width: number | string;
    height: number | string;
    videoRef: React.RefObject<any>;
    onLoad: (data: OnLoadData) => void;
    onSeek: (data: OnSeekData) => void;
    onError: (error: OnVideoErrorData) => void;
    onProgress: (data: OnProgressData) => void;
    onEnd: () => void;
    onBuffer: (data: OnBufferData) => void;
}
