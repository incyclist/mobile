import type { ConflictStepProps, ConflictStepRowProps } from 'incyclist-services'

/**
 * How a conflict's rows are laid out: the slot's name in a column left of Keep and Use (phone),
 * Keep and Use side by side under the name (tablet, landscape), or stacked under the name.
 */
export type ConflictRowsLayout = 'label-column' | 'side-by-side' | 'stacked'

export interface ConflictStepRowsProps {
    /** one row per slot, as the page service gives them */
    rows: ReadonlyArray<ConflictStepRowProps>
    onChoice: ConflictStepProps['onChoice']
    /** `stacked` if not given */
    layout?: ConflictRowsLayout
}

export interface ConflictStepBodyProps {
    /** the conflict as the page service gives it */
    step: ConflictStepProps
    /** the phone's short subline instead of the full one */
    compact: boolean
    /** what a tap on a row's choice calls: the step's own `onChoice`, or a guarded wrapper of it */
    onChoice: ConflictStepProps['onChoice']
}
