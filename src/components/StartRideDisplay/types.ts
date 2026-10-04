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
export type StartRideDisplayProps = (StartOverlayProps | GPXStartOverlayProps | VideoStartOverlayProps) & {
    onStart: ()=>void,
    onRetry: ()=>void,
    onCancel: (reason?:StartCancelReason)=>void,
    onIgnore: ()=>void,
    /** Street View only - lets the rider skip a slow/failing Street View start. */
    onStartWithMap?: ()=>void
}
