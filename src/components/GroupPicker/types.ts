export interface GroupPickerProps {
    label?: string;
    // Label column width in the <=5-groups ChipSelect rendering, for callers that need this field
    // aligned with sibling fields in a stacked form (e.g. WorkoutDetailsView). Defaults to 100,
    // matching the width this component always used before it was configurable. Not used by the
    // >5-groups inline-expanding list rendering, which sizes its label intrinsically.
    labelWidth?: number;
    groups: string[]; // existing group/category names
    value: string; // current value — may or may not be one of `groups` (a not-yet-committed new name)
    disabled?: boolean;
    // Offer the "+ New" free-text option (default true — the import/details
    // dialog contract). false for pure-selection contexts, e.g. the Workouts
    // list screen's group filter, where a not-yet-existing group is meaningless.
    allowNew?: boolean;
    onValueChange: (group: string) => void;
}
