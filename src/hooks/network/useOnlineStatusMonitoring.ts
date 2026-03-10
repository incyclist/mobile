import { useCallback, useEffect, useRef } from 'react'
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo'
import { useOnlineStatusMonitoring } from 'incyclist-services'
import { useLogging } from '../logging'

export const useOnlineStatusMonitoringInit = () => {
    const monitoring = useOnlineStatusMonitoring()
    const refInitialized = useRef(false)
    const refUnsubscribe = useRef<NetInfoSubscription|null>(null)
    const refStatus = useRef<boolean>(undefined)

    const {logEvent} = useLogging('Incyclist')

    useEffect(() => {
        if (refInitialized.current) return

        refInitialized.current = true

        console.log( '#  [useOnlineStatusMonitoringInit] init effect' )

        // fetch initial state, then subscribe
        NetInfo.fetch().then(state => {
            const status = state.isConnected ?? false
            refStatus.current = status
            monitoring.initialize(status)
            logEvent({message:'enabling online status monitoring',status: status? 'online':'offline' })

            refUnsubscribe.current = NetInfo.addEventListener(state => {
                const update = state.isConnected ?? false
                if (update!==refStatus.current) {
                    refStatus.current = update
                    monitoring.setOnline(update)
                    logEvent({message:'online status change',status: update? 'online':'offline' })
                }
            })
        })



    }, [logEvent, monitoring])

    
    const stopMonitoring = useCallback(()=> {
        if (refUnsubscribe.current)
            refUnsubscribe.current()
    },[])

    return  {
        stopMonitoring
    }

}