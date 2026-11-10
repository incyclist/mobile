// how close to the end of the rows still counts as "at the end", for rounding in scroll offsets
const END_TOLERANCE = 2

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
