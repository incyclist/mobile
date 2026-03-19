export type EditNumberProps = {
    label?: string;
    labelWidth?: number;
    value?: number;
    onValueChange: (value: number | undefined) => void;
    min?: number;
    max?: number;
    unit?: string;
    digits?: number;
};