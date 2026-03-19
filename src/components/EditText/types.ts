export type EditTextProps = {
    label?: string;
    labelWidth?: number;
    value?: string;
    onValueChange: (value: string) => void;
    length?: number;
};