export interface BinarySelectProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    labelPosition?: 'before' | 'after'; // default: 'before'
    trueLabel?: string;                  // default: 'Yes'
    falseLabel?: string;                 // default: 'No'
    disabled?: boolean;
}