import type { CapabilityDisplayProps, PairingCase, PairingRowLabelProps } from 'incyclist-services'

export interface CapabilityStatusBarsProps {
    capabilities?: {
        top: Array<CapabilityDisplayProps>
        bottom: Array<CapabilityDisplayProps>
        rowLabels?: { top: PairingRowLabelProps, bottom: PairingRowLabelProps }
    }
    readyToStart?: boolean
    /** nothing can search */
    noSearch?: boolean
    pairingCase?: PairingCase
}
