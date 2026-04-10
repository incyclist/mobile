import { OperationConfig } from '../OperationsSelector/types';
import { AppsOperation } from 'incyclist-services';

export interface AppSettingsViewProps {
    title: string;
    isConnected: boolean;
    isConnecting: boolean;
    connectButton: () => React.ReactElement;
    operations?: OperationConfig[];
    onDisconnect?: () => void;
    onOperationsChanged?: (operation: AppsOperation, enabled: boolean) => void;
    onBack?: () => void;
    compact?: boolean;
}