// Mirrors `ActivityUploadStatus` in incyclist-services, which gained 'loading' in 1.7.x.
// The value already reaches this component at runtime and already renders through the
// same branch as 'unknown' - only the type was out of date, which broke `tsc` on every PR.
export type UploadPillStatus = 'success' | 'failed' | 'unknown' | 'loading'

export interface UploadPillProps {
    type: string
    text?: string
    status: UploadPillStatus
    url?: string
    synchronizing?: boolean
    onSynchronize?: () => void
    onOpen?: () => void
}