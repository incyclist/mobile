export interface GroupPickerProps {
    label?: string;
    groups: string[]; // existing group/category names
    value: string; // current value — may or may not be one of `groups` (a not-yet-committed new name)
    disabled?: boolean;
    // Offer the "+ New" free-text option (default true — the import/details
    // dialog contract). false for pure-selection contexts, e.g. the Workouts
    // list screen's group filter, where a not-yet-existing group is meaningless.
    allowNew?: boolean;
    onValueChange: (group: string) => void;
}
