export interface BinarySelectProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    labelPosition?: 'before' | 'after'; // default: 'before'
    trueLabel?: string;                  // default: 'Yes'
    falseLabel?: string;                 // default: 'No'
    disabled?: boolean;
    // Fixed label column width, e.g. to align with EditNumber/GroupPicker (both default
    // to 100) when stacked in the same form. Undefined = size to content (current default).
    labelWidth?: number;
}