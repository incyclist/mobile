export type UploadPillStatus = 'success' | 'failed' | 'unknown'

export interface UploadPillProps {
    type: string
    text?: string
    status: UploadPillStatus
    url?: string
    synchronizing?: boolean
    onSynchronize?: () => void
    onOpen?: () => void
}