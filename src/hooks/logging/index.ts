import { EventLogger } from "gd-eventlog"
import { useRef } from "react"


export const useLogging =  ( name:string)=> {
    const refLogger = useRef<EventLogger>( new EventLogger( name) )

    
    const logEvent = (event:any) => {
        refLogger.current?.logEvent(event)
    }

    const logError = (err:any,fn:string)=> {
        refLogger.current?.logEvent( {message:'error', fn, error:err.message, stack:err.stack})
    }

    return {logEvent,logError}

}