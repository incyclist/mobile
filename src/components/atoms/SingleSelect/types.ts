export type SingleSelectProps = {
    label: string;
    options: Array<string>;
    selected?: string;
    labelWidth?: number;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
};