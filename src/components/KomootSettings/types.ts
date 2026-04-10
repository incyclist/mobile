import { OperationConfig } from '../OperationsSelector/types';
import { AppsOperation } from 'incyclist-services';

export interface KomootSettingsProps {
    onBack?: () => void
}

export interface KomootSettingsViewProps {
    isConnected: boolean
    isConnecting: boolean
    operations: OperationConfig[]
    showLoginDialog: boolean
    onConnect?: () => void
    onDisconnect?: () => void
    onOperationsChanged?: (operation: AppsOperation, enabled: boolean) => void
    onLoginSuccess?: () => void
    onLoginCancel?: () => void
    onBack?: () => void
}