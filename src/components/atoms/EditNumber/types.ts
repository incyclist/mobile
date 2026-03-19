export type EditNumberProps = {
    label: string;
    value?: number;
    labelWidth?: number;
    min?: number;
    max?: number;
    digits?: number;
    allowEmpty?: boolean;
    unit?: string;
    disabled?: boolean;
    onValueChange?: (value: number | undefined) => void;
};