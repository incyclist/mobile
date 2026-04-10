import { AppsOperation } from 'incyclist-services';

export interface OperationConfig {
    operation: AppsOperation;
    enabled: boolean;
}

export interface OperationsSelectorProps {
    operations?: OperationConfig[];
    onChanged?: (operation: AppsOperation, enabled: boolean) => void;
    compact?: boolean;
}