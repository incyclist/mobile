export interface KomootLoginDialogViewProps {
    username?: string;
    password?: string;
    userid?: string;
    isConnecting: boolean;
    errorMessage?: string;
    onUsernameChange?: (value: string) => void;
    onPasswordChange?: (value: string) => void;
    onUseridChange?: (value: string) => void;
    onConnect?: () => void;
    onCancel?: () => void;
    compact?: boolean;
}

export interface KomootLoginDialogProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}