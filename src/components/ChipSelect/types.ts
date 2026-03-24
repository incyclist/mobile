export type ChipSelectSingleProps = {
    label: string;
    options: Array<string>;
    selected?: string;
    labelWidth?: number;
    disabled?: boolean;
    multi?: false;
    onValueChange?: (value: string) => void;
};

export type ChipSelectMultiProps = {
    label: string;
    options: Array<string>;
    selectedValues?: string[];
    labelWidth?: number;
    disabled?: boolean;
    multi: true;
    onValueChange?: (values: string[]) => void;
};

export type ChipSelectProps = ChipSelectSingleProps | ChipSelectMultiProps;