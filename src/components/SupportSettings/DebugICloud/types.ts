export interface DebugICloudSectionViewProps {
    onPickFolder: () => void
    onProbeNoGrant: () => void
    onProbeWithGrant: () => void
    onCaptureGrant: () => void
    onProbeCaptured: () => void
    onDownloadLargest: () => void
    onEvictLargest: () => void
    onReadControlFilePlain: () => void
    onOpenPickerAtLastFolder: () => void
    onIdentityToken: () => void
}
