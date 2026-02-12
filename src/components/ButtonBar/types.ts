export interface ButtonBarProps {
    buttons: Array<ButtonProps>
}

export interface ButtonProps {
    label: string,
    primary?: boolean
    onClick: ()=>void
}

