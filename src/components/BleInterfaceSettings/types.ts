import { InterfaceSettingsDisplayProps } from 'incyclist-services';

export type BleInterfaceSettingsProps = InterfaceSettingsDisplayProps &  {
    visible: boolean;
    onClose: () => void;    
}

export interface BleInterfaceSettingsViewProps extends InterfaceSettingsDisplayProps {
    
    onClose: () => void;
    onEnable: () => void;
    onDisable: () => void;
    onReconnect: () => void;
    onRequestPermissions: () => void;
    needsPermissions: boolean;
    loading?: boolean
}
