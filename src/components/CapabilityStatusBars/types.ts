import type { CapabilityDisplayProps, PairingRowLabelProps } from 'incyclist-services'

export interface CapabilityStatusBarsProps {
    capabilities?: {
        top: Array<CapabilityDisplayProps>
        bottom: Array<CapabilityDisplayProps>
        rowLabels?: { top: PairingRowLabelProps, bottom: PairingRowLabelProps }
    }
}
