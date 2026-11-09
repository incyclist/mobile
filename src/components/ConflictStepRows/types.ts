import type { ConflictStepProps, ConflictStepRowProps } from 'incyclist-services'

export interface ConflictStepRowsProps {
    /** one row per slot, as the page service gives them */
    rows: ReadonlyArray<ConflictStepRowProps>
    onChoice: ConflictStepProps['onChoice']
}
