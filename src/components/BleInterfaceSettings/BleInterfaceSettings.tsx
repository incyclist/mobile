import React, { useEffect, useState, useCallback,  useRef, memo } from 'react';
import { getDevicesPageService, Observer } from 'incyclist-services';
import { BleInterfaceSettingsView } from './BleInterfaceSettingsView';
import { BleInterfaceSettingsProps } from './types';
import { PermissionService } from '../../services';
import { getBleBinding } from '../../bindings/ble';


export const BleInterfaceSettings = memo(({   }: BleInterfaceSettingsProps) => {
    const pairingService = getDevicesPageService();
    const permissionService = new PermissionService()

    const [displayProps, setDisplayProps] = useState(pairingService.getInterfaceSettingsDisplayProps());
    const [hasPermissions, setHasPermissions] = useState<boolean|undefined>(undefined);
    const refObserver = useRef<Observer>(null)
    

    const updateState = useCallback(() => {
        setDisplayProps(pairingService.getInterfaceSettingsDisplayProps());
    }, [pairingService]);

    const checkPermissions = useCallback(async () => {
        const granted = await permissionService.hasBlePermission();
        setHasPermissions(granted);
    }, []);

    useEffect(() => {
        if (hasPermissions!==undefined)
            return

        checkPermissions();

        if (refObserver.current)
            return;

        const observer = pairingService.getInterfaceSettingsObserver();        
        observer?.on('update', updateState);
        refObserver.current = observer

    }, [ pairingService, updateState, checkPermissions]);

    const handleRequestPermissions = async () => {
        const granted = await permissionService.requestBlePermission();

        setHasPermissions(granted);
        if (granted) {
            pairingService.refreshInterface();
        }
    };

    let needsPermission = !hasPermissions

    // if we are in error state, we need to find out if this is due to missing permissions or because Bluetooth is disabed
    if (displayProps.error) {
        needsPermission = getBleBinding().state==='unauthorized'
    }

    return (
        <BleInterfaceSettingsView
            {...displayProps}
            
            onClose={ ()=>pairingService.closeInterfaceSettings()}
            onEnable={() => pairingService.enableInterface('ble')}
            onDisable={() => pairingService.disableInterface('ble')}
            onReconnect={() => pairingService.reconnectInterface()}
            onRequestPermissions={handleRequestPermissions}
            needsPermissions={needsPermission}
            loading={hasPermissions===undefined}
        />
    );
})
