export type AppsOperation =
    | 'ActivityUpload'
    | 'WorkoutUpload'
    | 'WorkoutDownload'
    | 'RouteDownload'
    | 'ActivityDownload';

export interface OperationConfig {
    operation: AppsOperation;
    enabled: boolean;
}

export interface OperationsSelectorProps {
    operations?: OperationConfig[];
    onChanged?: (operation: AppsOperation, enabled: boolean) => void;
    compact?: boolean;
}