import type { ConflictStepProps } from 'incyclist-services'

export interface PairingConflictCardProps {
    /** the conflict as the page service gives it */
    conflict: ConflictStepProps
    /** `phone`: the short subline; `tablet`: the full one */
    layout: 'phone' | 'tablet'
}
