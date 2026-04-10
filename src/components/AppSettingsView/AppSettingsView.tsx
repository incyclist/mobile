import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, textSizes } from '../../theme';
import { AppSettingsViewProps } from './types';
import { Button } from '../ButtonBar/ButtonBar';
import { OperationsSelector } from '../OperationsSelector';

export const AppSettingsView = ({
    title,
    isConnected,
    isConnecting,
    connectButton,
    operations,
    onDisconnect,
    onOperationsChanged,
    onBack,
    compact = false,
}: AppSettingsViewProps) => {
    const handleDisconnect = useCallback(() => {
        if (onDisconnect) {
            onDisconnect();
        }
    }, [onDisconnect]);

    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        }
    }, [onBack]);

    const titleStyle = [
        styles.title,
        compact && styles.titleCompact
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={titleStyle}>{title}</Text>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
            </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: textSizes.pageTitle,
        color: colors.text,
        fontWeight: '700',
    },
    titleCompact: {
        fontSize: textSizes.dialogTitle,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 32,
        color: colors.text,
    },
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