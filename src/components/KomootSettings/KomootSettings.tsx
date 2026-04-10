import React, { useCallback, useRef, useState } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
} from 'react-native';
import { AppsOperation, useAppsService } from 'incyclist-services';
import { KomootSettingsProps } from './types';
import { AppSettingsView } from '../AppSettingsView';
import { KomootLoginDialog } from '../KomootLoginDialog';
import { OperationConfig } from '../OperationsSelector/types';
import { useLogging } from '../../hooks/logging';
import { useUnmountEffect } from '../../hooks/unmount';
import { colors, textSizes } from '../../theme';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const KomootLogo = require('../../assets/apps/komoot.svg').default;

export const KomootSettings = ({ onBack }: KomootSettingsProps) => {
    const service = useAppsService();
    const { logEvent } = useLogging('KomootSettings');

    const refInitialized = useRef<boolean>(false);

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
    const [operations, setOperations] = useState<OperationConfig[]>([]);

    if (!refInitialized.current) {
        refInitialized.current = true;
        const initial = service.openAppSettings('komoot');
        if (initial) {
            setIsConnected(initial.isConnected ?? false);
            setOperations((initial.operations as OperationConfig[]) ?? []);
        }
        logEvent({ message: 'komoot settings opened' });
    }

    useUnmountEffect(() => {
        // no explicit closePage call needed; cleanup if required
    });

    const handleConnect = useCallback(() => {
        setIsConnecting(true);
        setShowLoginDialog(true);
    }, []);

    const handleLoginSuccess = useCallback(() => {
        setShowLoginDialog(false);
        const updated = service.openAppSettings('komoot');
        if (updated) {
            setIsConnected(updated.isConnected ?? false);
            setOperations((updated.operations as OperationConfig[]) ?? []);
        }
        setIsConnecting(false);
    }, [service]);

    const handleLoginCancel = useCallback(() => {
        setShowLoginDialog(false);
        setIsConnecting(false);
    }, []);

    const handleDisconnect = useCallback(() => {
        service.disconnect('komoot');
        setIsConnected(false);
        setOperations([]);
        setIsConnecting(false);
    }, [service]);

    const handleOperationsChanged = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            const updated = service.enableOperation('komoot', operation, enabled);
            setOperations((updated as OperationConfig[]) ?? []);
        },
        [service],
    );

    const renderConnectButton = useCallback((): React.ReactElement => {
        return (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                <View style={styles.connectButtonContent}>
                    <KomootLogo width={24} height={24} />
                    <Text style={styles.connectButtonText}>Connect with Komoot</Text>
                </View>
            </TouchableOpacity>
        );
    }, [handleConnect]);

    return (
        <>
            <AppSettingsView
                title="Komoot"
                isConnected={isConnected}
                isConnecting={isConnecting}
                connectButton={renderConnectButton}
                operations={operations}
                onDisconnect={handleDisconnect}
                onOperationsChanged={handleOperationsChanged}
                onBack={onBack}
            />
            {showLoginDialog && (
                <KomootLoginDialog
                    onSuccess={handleLoginSuccess}
                    onCancel={handleLoginCancel}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    connectButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        backgroundColor: colors.buttonPrimary,
        alignSelf: 'flex-start',
    },
    connectButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    connectButtonText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: '600',
    },
});