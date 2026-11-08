import type { PairingHelperReasonProps } from 'incyclist-services'

export interface VisibleReasons {
    visible: PairingHelperReasonProps[]
    /** some answers are hidden behind "Other answers" */
    folded: boolean
}

/**
 * Which answers to show. Where folding is on (phone), a picked answer folds the others away, until
 * the rider asks for them again.
 *
 * @param reasons the answers, in display order
 * @param options `fold`: folding is on; `expanded`: the rider asked to see the other answers
 */
export const getVisibleReasons = (
    reasons: ReadonlyArray<PairingHelperReasonProps>,
    { fold, expanded }: { fold: boolean, expanded: boolean },
): VisibleReasons => {
    const selected = reasons.find(r => r.selected)
    if (!fold || !selected || expanded)
        return { visible: [...reasons], folded: false }
    return { visible: [selected], folded: true }
}
