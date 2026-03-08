import { GPXStartOverlayProps, StartOverlayProps, VideoStartOverlayProps,CurrentRideDeviceInfo,RideMapState } from "incyclist-services";

export type {
    GPXStartOverlayProps, StartOverlayProps, VideoStartOverlayProps,
    CurrentRideDeviceInfo,
    RideMapState
}

export type StartCancelReason = {
    device?:boolean
    video?:boolean
    map?:boolean
}
export type StartRideDisplayProps = (StartOverlayProps | GPXStartOverlayProps | VideoStartOverlayProps) & {
    onStart: ()=>void, 
    onRetry: ()=>void, 
    onCancel: (reason?:StartCancelReason)=>void, 
    onIgnore: ()=>void    
}
