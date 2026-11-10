// how close to the end of the rows still counts as "at the end", for rounding in scroll offsets
const END_TOLERANCE = 2

/**
 * What the conflict dialog's footer says about the conflicts waiting behind the one shown, next
 * to Done, which moves on to the next one.
 *
 * @param queued how many conflicts wait
 * @param compact the phone's shorter wording
 * @returns e.g. "2 more to check" (phone) or "2 more devices to check"; `undefined` when none waits
 */
export const getConflictQueuedNote = (queued: number, compact: boolean): string | undefined => {
    if (!(queued > 0))
        return undefined
    if (compact)
        return `${queued} more to check`
    return `${queued} more ${queued === 1 ? 'device' : 'devices'} to check`
}

export interface ScrollSizes {
    /** the visible height of the scroll view */
    viewHeight: number
    /** the height of everything in it */
    contentHeight: number
    /** how far it is scrolled down */
    offset: number
}

/** Whether some of the rows are hidden below the visible part of their scroll view. */
export const hasMoreBelow = ({ viewHeight, contentHeight, offset }: ScrollSizes): boolean =>
    viewHeight > 0 && contentHeight - (offset + viewHeight) > END_TOLERANCE
