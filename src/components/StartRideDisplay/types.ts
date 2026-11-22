import { GPXStartOverlayProps, StartOverlayProps, VideoStartOverlayProps,CurrentRideDeviceInfo,RideMapState } from "incyclist-services";

export type {
    GPXStartOverlayProps, StartOverlayProps, VideoStartOverlayProps,
    CurrentRideDeviceInfo,
    RideMapState
}
export type { SvViewState } from "incyclist-services";

export type StartCancelReason = {
    device?:boolean
    video?:boolean
    map?:boolean
}

/*
 * Start overlay v2 contract. These mirror the optional fields that newer versions of
 * incyclist-services add to the start overlay props. They are declared here as well so that this
 * component compiles against (and tolerates) a services version that does not provide them yet:
 * when `startPhase` is undefined the legacy rendering path is used.
 */
export type StartPhase = 'devices' | 'content' | 'ready'
export type StartDeviceState = 'starting' | 'uploading' | 'started' | 'not-connected' | 'failed' | 'ignored'
export type StartContentInfo = {
    kind: 'video' | 'map' | 'satellite' | 'streetview'
    label: string
    state: 'waiting' | 'loading' | 'ready' | 'unavailable' | 'failed'
    progress?: { convertPct?: number, convertSeconds?: number }
}
export type StartReadyInfo = {
    pendingSensors: string[]
    notConnectedSensors: string[]
    viewFallback: boolean
}
export type StartDeviceInfo = CurrentRideDeviceInfo & {
    startState?: StartDeviceState
    slow?: boolean
    canRetry?: boolean
    canIgnore?: boolean
}
export type StartOverlayV2Props = {
    startPhase?: StartPhase
    startSlow?: boolean
    startContent?: StartContentInfo
    startReadyInfo?: StartReadyInfo
}

export type StartRideDisplayProps = (StartOverlayProps | GPXStartOverlayProps | VideoStartOverlayProps) & StartOverlayV2Props & {
    onStart: ()=>void,
    onRetry: ()=>void,
    onCancel: (reason?:StartCancelReason)=>void,
    onIgnore: ()=>void,
    /** Street View only - lets the rider skip a slow/failing Street View start. */
    onStartWithMap?: ()=>void,
    /** Start overlay v2: restart only this device */
    onRetryDevice?: (udid:string)=>void,
    /** Start overlay v2: stop waiting for this sensor (this ride only) */
    onIgnoreDevice?: (udid:string)=>void,
}
