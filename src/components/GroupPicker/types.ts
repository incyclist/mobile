export interface GroupPickerProps {
    label?: string;
    groups: string[]; // existing group/category names
    value: string; // current value — may or may not be one of `groups` (a not-yet-committed new name)
    disabled?: boolean;
    onValueChange: (group: string) => void;
}
