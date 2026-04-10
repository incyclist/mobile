export interface PasswordEditProps {
    label: string;
    labelWidth?: number;
    value?: string;
    onChangeText?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
    compact?: boolean;
}