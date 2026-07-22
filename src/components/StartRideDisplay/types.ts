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
    /**
     * Workout-ride-only (workout-mobile-hld.md §3.2 "StartRideDisplay gesture legend", session
     * 5.6). When true, the default 'starting' state (waiting for pedaling, no error) shows a
     * compact "◀ ▶ step · ▲ ▼ load ±N%" legend teaching the swipe gestures before the ride
     * starts. `loadIncrementPct` supplies N — always the live `preferences.workouts.loadIncrement`
     * setting (session 5.4), never hardcoded.
     */
    workout?: boolean
    loadIncrementPct?: number
}
