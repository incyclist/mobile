import { InterfaceSettingsDisplayProps } from 'incyclist-services';

export type BleInterfaceSettingsProps = {
    visible: boolean;
    onClose: () => void;
};

export interface BleInterfaceSettingsViewProps extends InterfaceSettingsDisplayProps {
    onClose: () => void;
    onEnable: () => void;
    onDisable: () => void;
    onReconnect: () => void;
    onRequestPermissions: () => void;
    onOpenLocationSettings?: () => void;
    needsPermissions: boolean;
    locationServicesDisabled?: boolean;
    loading?: boolean;
}
