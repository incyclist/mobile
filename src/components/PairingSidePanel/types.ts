import type { ReactNode } from 'react'

export interface PairingSidePanelProps {
    title: string
    /** a short line beside the title, e.g. how many more are waiting */
    titleNote?: string
    subline?: string
    /** the ✕ in the header */
    onClose: () => void
    /** the panel's body; it takes the space between the header and the pinned area */
    children: ReactNode
    /** pinned at the bottom, so a large font scale never pushes it off-screen */
    pinned?: ReactNode
}

export interface PairingSidePanelActionProps {
    label: string
    /** a line shown above the button */
    note?: string
    onPress: () => void
}
