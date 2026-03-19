export type EditTextProps = {
    label: string;
    value?: string;
    labelWidth?: number;
    placeholder?: string;
    disabled?: boolean;
    validate?: (value: string) => string | null;
    onValueChange?: (value: string) => void;
};