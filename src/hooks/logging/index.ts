import { EventLogger } from "gd-eventlog"
import { useCallback, useRef } from "react"


export const useLogging =  ( name:string)=> {
    const refLogger = useRef<EventLogger>( new EventLogger( name) )
    
    const logEvent = useCallback((event:any) => {
        refLogger.current?.logEvent(event)
    },[])

    const logError = useCallback((err:any,fn:string)=> {
        try {
            refLogger.current?.logEvent( {message:'error', fn, error:err?.message ?? String(err), stack:err?.stack})
        }
        catch {
            // logging must never throw
        }
    },[])


    return {logEvent,logError}

}