import type { PairingStatusDisplayProps } from 'incyclist-services'

export interface PairingStatusLineProps {
    status: PairingStatusDisplayProps
    /** `short` is the phone copy */
    variant: 'full' | 'short'
    /** only the state, without the link: the helper is open beside it, holding the tip and the help */
    stateOnly?: boolean
    /** what the link does; without it, the link isn't shown */
    onLinkPress?: () => void
}
