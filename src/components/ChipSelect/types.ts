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

type ChipSelectCommonProps = {
    label: string;
    options: Array<ChipOption>;
    labelWidth?: number;
    disabled?: boolean;
    /**
     * Minimum height of a single chip, in px. Opt-in and unset by default, so the chip keeps
     * its compact padding-derived height everywhere it is not asked for. Set it where the
     * control is meant to be tapped repeatedly rather than picked once — the default height is
     * below the 44px touch-target floor, which only matters when tapping is the interaction.
     */
    chipMinHeight?: number;
};

export type ChipSelectSingleProps = ChipSelectCommonProps & {
    selected?: string;
    multi?: false;
    onValueChange?: (value: string) => void;
};

export type ChipSelectMultiProps = ChipSelectCommonProps & {
    selectedValues?: string[];
    multi: true;
    onValueChange?: (values: string[]) => void;
};

export type ChipSelectProps = ChipSelectSingleProps | ChipSelectMultiProps;
