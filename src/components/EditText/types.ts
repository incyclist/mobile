export type EditTextProps = {
    label: string;
    value?: string;
    labelWidth?: number;
    placeholder?: string;
    disabled?: boolean;
    validate?: (value: string) => string | null;
    onValueChange?: (value: string) => void;
    length?: number; // Added for input width control
};