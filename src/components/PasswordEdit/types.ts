export interface PasswordEditProps {
    label?: string;
    value?: string;
    onChangeText?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    compact?: boolean;
}