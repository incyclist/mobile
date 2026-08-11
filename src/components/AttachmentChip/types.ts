export interface AttachmentChipProps {
    /** e.g. "Route" or "Workout" - rendered as "<label>: <name>". */
    label: string;
    name: string;
    onClear: () => void;
    testID?: string;
}
