import React, { useCallback } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
} from 'react-native';
import { AppsOperation } from 'incyclist-services';
import { KomootSettingsViewProps } from './types';
import { AppSettingsView } from '../AppSettingsView';
import { KomootLoginDialog } from '../KomootLoginDialog';
import { OperationConfig } from '../OperationsSelector/types';
import { colors, textSizes } from '../../theme';
import { SvgUri } from 'react-native-svg';

export const KomootSettingsView = ({
    isConnected,
    isConnecting,
    operations,
    showLoginDialog,
    onConnect,
    onDisconnect,
    onOperationsChanged,
    onLoginSuccess,
    onLoginCancel,
    onBack,
}: KomootSettingsViewProps) => {

    const renderConnectButton = useCallback((): React.ReactElement => {
        return (
            <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
                <View style={styles.connectButtonContent}>
                    <SvgUri uri="https://www.komoot.com/assets/4d8ae313eec53e6e.svg" width={24} height={24} />
                    <Text style={styles.connectButtonText}>Connect with Komoot</Text>
                </View>
            </TouchableOpacity>
        );
    }, [onConnect]);

    const handleOperationsChanged = useCallback(
        (operation: AppsOperation, enabled: boolean) => {
            onOperationsChanged?.(operation, enabled);
        },
        [onOperationsChanged],
    );

    return (
        <>
            <AppSettingsView
                title="Komoot"
                isConnected={isConnected}
                isConnecting={isConnecting}
                connectButton={renderConnectButton}
                operations={operations as OperationConfig[]}
                onDisconnect={onDisconnect}
                onOperationsChanged={handleOperationsChanged}
                onBack={onBack}
            />
            {showLoginDialog && (
                <KomootLoginDialog
                    onSuccess={onLoginSuccess}
                    onCancel={onLoginCancel}
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