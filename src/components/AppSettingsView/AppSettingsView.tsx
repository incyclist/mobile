import React, { useCallback, useContext } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';
import { AppSettingsViewProps } from './types';
import { Button } from '../ButtonBar/ButtonBar';
import { OperationsSelector } from '../OperationsSelector';
import { Dialog } from '../Dialog';

/**
 * Context to allow parent components (like AppsDialog) to override the standalone behavior
 * of AppSettingsView without modifying intermediate smart components.
 */
export const AppSettingsContext = React.createContext({ standalone: true });

export interface ExtendedAppSettingsViewProps extends AppSettingsViewProps {
    standalone?: boolean;
}

export const AppSettingsView = ({
    title,
    isConnected,
    isConnecting,
    connectButton,
    operations,
    onDisconnect,
    onOperationsChanged,
    onBack,
    standalone: standaloneProp,
}: ExtendedAppSettingsViewProps) => {
    const { standalone: contextStandalone } = useContext(AppSettingsContext);
    const standalone = standaloneProp ?? contextStandalone;

    const handleDisconnect = useCallback(() => {
        if (onDisconnect) {
            onDisconnect();
        }
    }, [onDisconnect]);

    const content = (
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
    );

    if (!standalone) {
        return content;
    }

    return (
        <Dialog
            title={title}
            variant="details"
            onOutsideClick={onBack}
        >
            {content}
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