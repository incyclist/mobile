export interface ButtonBarProps {
    buttons: Array<ButtonProps>
}

export interface ButtonProps {
    id?: string
    label: string,
    primary?: boolean
    onClick: ()=>void
}

