import type { ConflictStepProps, ConflictStepRowProps } from 'incyclist-services'

export interface ConflictStepRowsProps {
    /** one row per slot, as the page service gives them */
    rows: ReadonlyArray<ConflictStepRowProps>
    onChoice: ConflictStepProps['onChoice']
}

export interface ConflictStepBodyProps {
    /** the conflict as the page service gives it */
    step: ConflictStepProps
    /** the phone's short subline instead of the full one */
    compact: boolean
    /** what a tap on a row's choice calls: the step's own `onChoice`, or a guarded wrapper of it */
    onChoice: ConflictStepProps['onChoice']
}
