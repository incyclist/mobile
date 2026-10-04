export interface RideViewNoticeProps {
    /** one-shot: set by the service (rideViewNotice or svCoverageNotice), then cleared on the
     *  next read - see RideViewNotice.tsx for why it's captured locally */
    notice?: { cause: string } | { ts: number } | null;
    message: string;
}
