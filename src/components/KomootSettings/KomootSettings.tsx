import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppsOperation, useAppsService } from 'incyclist-services';
import KomootLogo from '../../assets/apps/komoot.svg';
import { AppSettingsView } from '../AppSettingsView';
import { KomootLoginDialog } from '../KomootLoginDialog';
import { Dialog } from '../Dialog';
import { useLogging } from '../../hooks/logging';
import { useUnmountEffect } from '../../hooks/unmount';
import { colors, textSizes } from '../../theme';
import { KomootSettingsProps } from './types';

export const KomootSettings = ({ onBack }: KomootSettingsProps) => {
    const service = useAppsService();
    const { logEvent } = useLogging('KomootSettings');

    const refInitialized = useRef<boolean>(false);

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
    const [operations, setOperations] = useState<AppsOperation[]>([]);

    const loadSettings = useCallback(() => {
        if (!service) return;
        const result = service.openAppSettings('komoot');
        if (result) {
            setIsConnected(result.isConnected ?? false);
            setOperations(result.operations ?? []);
        }
    }, [service]);

    useEffect(() => {
        if (!service || refInitialized.current) return;
        refInitialized.current = true;
        logEvent({ message: 'komoot settings opened' });
        loadSettings();
    }, [service, logEvent, loadSettings]);

    useUnmountEffect(() => {
        refInitialized.current = false;
    });

    const onConnect = useCallback(() => {
        setIsConnecting(true);
        setShowLoginDialog(true);
    }, []);

    const onLoginSuccess = useCallback(() => {
        setShowLoginDialog(false);
        setIsConnecting(false);
        loadSettings();
    }, [loadSettings]);

    const onLoginCancel = useCallback(() => {
        setShowLoginDialog(false);
        setIsConnecting(false);
    }, []);

    const onDisconnect = useCallback(() => {
        if (!service) return;
        service.disconnect('komoot');
        setIsConnected(false);
        setIsConnecting(false);
        setOperations([]);
    }, [service]);

    const onOperationsChanged = useCallback((operation: AppsOperation, enabled: boolean) => {
        if (!service) return;
        const updated = service.enableOperation('komoot', operation, enabled);
        setOperations(updated ?? []);
    }, [service]);

    const connectButton = (
        <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
            <KomootLogo width={32} height={32} />
            <Text style={styles.connectText}>Connect with Komoot</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <AppSettingsView
                isConnected={isConnected}
                isConnecting={isConnecting}
                operations={operations}
                connectButton={connectButton}
                onBack={onBack}
                onDisconnect={onDisconnect}
                onOperationsChanged={onOperationsChanged}
            />

            {showLoginDialog && (
                <Dialog title="Komoot Login" variant="details">
                    <KomootLoginDialog
                        onSuccess={onLoginSuccess}
                        onCancel={onLoginCancel}
                    />
                </Dialog>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    connectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.buttonPrimary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    connectText: {
        color: colors.text,
        fontSize: textSizes.normalText,
        marginLeft: 10,
        fontWeight: '600',
    },
});