export interface ButtonBarProps {
    buttons: Array<ButtonProps>
    /**
     * Opt-in layout diagnostics (FIXES_BACKLOG #52). Off everywhere by default - ButtonBar is
     * used by nearly every dialog, so unconditional logging would flood the event log. Only the
     * ride start overlay enables it, and each slot logs at most once per distinct layout.
     */
    debugLayout?: boolean
}

export interface ButtonProps {
    id?: string
    label: string
    primary?: boolean
    attention?: boolean
    onClick: () => void
    disabled?: boolean
}
