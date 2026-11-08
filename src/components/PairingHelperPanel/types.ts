import type { PairingHelperDisplayProps } from 'incyclist-services'

export interface PairingHelperPanelProps {
    helper: PairingHelperDisplayProps
    /**
     * `phone`: the other answers fold away after a pick, the tip uses the phone copy, and the footer
     * line is left out. `tablet`: every answer stays listed, with the full tip and the footer line.
     */
    layout: 'phone' | 'tablet'
}
