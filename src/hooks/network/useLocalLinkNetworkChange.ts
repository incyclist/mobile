import { useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import type { NetInfoState } from '@react-native-community/netinfo'
import { useLocalLinkClient } from 'incyclist-services'
import { useLogging } from '../logging'

/**
 * What identifies "the same network" for the link client: the connection type and, where the
 * platform reports it, the address and network name. `undefined` while the phone is offline.
 */
export const getNetworkSignature = (state: Pick<NetInfoState, 'isConnected' | 'type'> & { details?: unknown }): string | undefined => {
    if (!state?.isConnected)
        return undefined
    const details = (state.details ?? {}) as { ipAddress?: unknown, ssid?: unknown, subnet?: unknown }
    return [state.type, details.ssid, details.ipAddress, details.subnet].map(v => (typeof v === 'string' ? v : '')).join('|')
}

/**
 * Tells the local-link client when the phone's network changes (another WiFi, WiFi back after being
 * off), so that it retries the saved computers right away instead of waiting for the next
 * announcement. Going offline and the first state after subscribing are not a change; WiFi coming back is.
 */
export const useLocalLinkNetworkChange = () => {
    const { logError } = useLogging('Incyclist')

    useEffect(() => {
        let last: string | undefined
        let first = true
        let unsubscribe: (() => void) | undefined

        try {
            unsubscribe = NetInfo.addEventListener(state => {
                try {
                    const signature = getNetworkSignature(state)
                    // coming back online counts as a change: `last` is undefined while offline
                    const changed = !first && signature !== undefined && signature !== last
                    first = false
                    last = signature
                    if (changed)
                        useLocalLinkClient().onNetworkChange()
                }
                catch (err) {
                    logError(err as Error, 'useLocalLinkNetworkChange')
                }
            })
        }
        catch (err) {
            logError(err as Error, 'useLocalLinkNetworkChange')
        }

        return () => {
            try {
                unsubscribe?.()
            }
            catch {
                // already unsubscribed
            }
        }
    }, [logError])
}
