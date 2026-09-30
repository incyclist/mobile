export interface RideViewNoticeProps {
    /** one-shot: set once by the service right after an automatic Street View fallback, then
     *  cleared on the next read (INC-42) - see RideViewNotice.tsx for why it's captured locally */
    notice?: { cause: string } | null;
}
