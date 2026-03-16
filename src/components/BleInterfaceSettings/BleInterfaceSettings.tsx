import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { Platform, Linking } from 'react-native';
import { getDevicesPageService, Observer } from 'incyclist-services';
import { BleInterfaceSettingsView } from './BleInterfaceSettingsView';
import { PermissionService } from '../../services/PermissionsService';
import { getBleBinding } from '../../bindings/ble';

export const BleInterfaceSettings = memo(() => {
    const pairingService = getDevicesPageService();
    const permissionService = useMemo(() => new PermissionService(), []);

    const [displayProps, setDisplayProps] = useState(pairingService.getInterfaceSettingsDisplayProps());
    const [hasPermissions, setHasPermissions] = useState<boolean | undefined>(undefined);
    const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | undefined>(undefined);
    const refObserver = useRef<Observer | undefined | null>(null);

    const updateState = useCallback(() => {
        setDisplayProps(pairingService.getInterfaceSettingsDisplayProps());
    }, [pairingService]);

    const checkPermissions = useCallback(async () => {
        const bleGranted = await permissionService.hasBlePermission();
        const locEnabled = await permissionService.hasLocationServicesEnabled();
        setHasPermissions(bleGranted);
        setLocationServicesEnabled(locEnabled);
    }, [permissionService]);

    useEffect(() => {
        if (hasPermissions !== undefined && locationServicesEnabled !== undefined) {
            return;
        }

        checkPermissions();

        if (refObserver.current) {
            return;
        }

        const observer = pairingService.getInterfaceSettingsObserver();
        if (observer) {
            observer.on('update', updateState);
            refObserver.current = observer;
        }
    }, [pairingService, updateState, checkPermissions, hasPermissions, locationServicesEnabled]);

    const handleRequestPermissions = async () => {
        const granted = await permissionService.requestBlePermission();

        setHasPermissions(granted);
        if (granted) {
            pairingService.refreshInterface();
            pairingService.closeInterfaceSettings();
        }
    };

    const handleOpenLocationSettings = useCallback(() => {
        if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        }
    }, []);

    let needsPermission = !hasPermissions;

    // if we are in error state, we need to find out if this is due to missing permissions or because Bluetooth is disabled
    if (displayProps.state === 'error') {
        needsPermission = getBleBinding().state === 'unauthorized';
    }

    const locationServicesDisabled = locationServicesEnabled === false && Number(Platform.Version) < 31;
    const isLoading = hasPermissions === undefined || locationServicesEnabled === undefined;

    return (
        <BleInterfaceSettingsView
            {...displayProps}
            onClose={() => pairingService.closeInterfaceSettings()}
            onEnable={() => pairingService.enableInterface('ble')}
            onDisable={() => pairingService.disableInterface('ble')}
            onReconnect={() => pairingService.reconnectInterface()}
            onRequestPermissions={handleRequestPermissions}
            onOpenLocationSettings={handleOpenLocationSettings}
            needsPermissions={needsPermission}
            locationServicesDisabled={locationServicesDisabled}
            loading={isLoading}
        />
    );
});
