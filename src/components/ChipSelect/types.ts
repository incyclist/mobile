import type { TextStyle } from 'react-native';

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
    /**
     * Drops the container's default `marginVertical: 8` - opt-in so every existing caller keeps
     * its current spacing. Set it where an outer layout already budgets the row's height exactly
     * (e.g. a fixed-height row in a space-constrained dialog) and the extra 16px would overflow it.
     */
    dense?: boolean;
    /**
     * Overrides applied on top of the label's default text style. Opt-in - unset keeps every
     * existing caller's current label styling. Set it where the surrounding layout mixes
     * ChipSelect with other label-left fields (EditText/EditNumber-style) that use a different
     * label size, so the row reads as one consistent set rather than ChipSelect's label standing
     * out at its own default size.
     */
    labelTextStyle?: TextStyle;
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
