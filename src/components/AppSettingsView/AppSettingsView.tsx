import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';
import { AppSettingsViewProps } from './types';
import { Button } from '../ButtonBar/ButtonBar';
import { OperationsSelector } from '../OperationsSelector';
import { Dialog } from '../Dialog';

export const AppSettingsView = ({
    title,
    isConnected,
    isConnecting,
    connectButton,
    operations,
    onDisconnect,
    onOperationsChanged,
    onBack,
}: AppSettingsViewProps) => {
    const handleDisconnect = useCallback(() => {
        if (onDisconnect) {
            onDisconnect();
        }
    }, [onDisconnect]);

    return (
        <Dialog
            title={title}
            variant="details"
            onOutsideClick={onBack}
        >
            <View style={styles.content}>
                <View style={styles.connectArea}>
                    {!isConnected && !isConnecting && connectButton()}
                    {isConnected && (
                        <Button 
                            label="Disconnect" 
                            onClick={handleDisconnect} 
                            attention 
                        />
                    )}
                </View>

                {isConnecting && (
                    <View style={styles.loaderArea}>
                        <ActivityIndicator size="large" color={colors.buttonPrimary} />
                    </View>
                )}

                {isConnected && (
                    <View style={styles.operationsArea}>
                        <OperationsSelector 
                            operations={operations || []} 
                            onChanged={onOperationsChanged} 
                        />
                    </View>
                )}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    connectArea: {
        alignItems: 'center',
        marginVertical: 16,
    },
    loaderArea: {
        marginVertical: 16,
        alignItems: 'center',
    },
    operationsArea: {
        flex: 1,
        marginTop: 16,
    },
});