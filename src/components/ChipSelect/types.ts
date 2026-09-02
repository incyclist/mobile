export type NormalizedChipOption = {
    label: string;
    disabled?: boolean;
    message?: string;
};

/**
 * A chip option is either a plain string (pre-existing contract — label and
 * selection value are the same string) or a richer object describing a
 * per-option disabled state and an explanation to show for it.
 */
export type ChipOption = string | NormalizedChipOption;

export type ChipSelectSingleProps = {
    label: string;
    options: Array<ChipOption>;
    selected?: string;
    labelWidth?: number;
    disabled?: boolean;
    multi?: false;
    onValueChange?: (value: string) => void;
};

export type ChipSelectMultiProps = {
    label: string;
    options: Array<ChipOption>;
    selectedValues?: string[];
    labelWidth?: number;
    disabled?: boolean;
    multi: true;
    onValueChange?: (values: string[]) => void;
};

export type ChipSelectProps = ChipSelectSingleProps | ChipSelectMultiProps;
