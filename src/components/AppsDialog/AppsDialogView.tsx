import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppsDialogViewProps } from './types';
import { Dialog } from '../Dialog';
import { colors, textSizes } from '../../theme';
import { AppSettingsContext } from '../AppSettingsView/AppSettingsView';
import { OAuthAppSettings } from '../OAuthAppSettings/OAuthAppSettings';
import { KomootSettings } from '../KomootSettings/KomootSettings';

// Stable reference so AppSettingsContext.Provider (rendered inside a .map() below, where
// useMemo can't be used) doesn't re-trigger consumers on every render — see SonarCloud
// typescript:S6481 on PR #404.
const NON_STANDALONE_CONTEXT_VALUE = { standalone: false };

export const AppsDialogView = ({
    visible,
    apps,
    onClose,
    renderApp: renderAppProp,
}: AppsDialogViewProps) => {
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const handleToggle = useCallback((key: string) => {
        setExpandedKey(prev => (prev === key ? null : key));
    }, []);

    const defaultRenderApp = useCallback((key: string, onBack: () => void, _standalone: boolean) => {
        if (key === 'komoot') {
            return <KomootSettings onBack={onBack} />;
        }
        const name = apps.find(a => a.key === key)?.name;
        return <OAuthAppSettings appKey={key} name={name} onBack={onBack} />;
    }, [apps]);

    const renderApp = renderAppProp || defaultRenderApp;

    const dialogButtons = useMemo(() => [
        { label: 'Close', onClick: onClose, primary: true }
    ], [onClose]);

    return (
        <Dialog
            title="Apps"
            variant="full"
            visible={visible}
            onOutsideClick={onClose}
            buttons={dialogButtons}
        >
            <View style={styles.container}>
                {apps.map((app) => {
                    const isConnected = app.isConnected ?? false;
                    const isExpanded = expandedKey === app.key;

                    const handlePress = () => handleToggle(app.key);

                    const badgeStyle = [
                        styles.badge,
                        { backgroundColor: isConnected ? colors.success : colors.disabled }
                    ];

                    return (
                        <View key={app.key} style={styles.section}>
                            <TouchableOpacity
                                style={styles.header}
                                onPress={handlePress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.headerLeft}>
                                    <Text style={styles.appName}>{app.name}</Text>
                                    <View style={badgeStyle} />
                                </View>
                                <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>
                                    {'>'}
                                </Text>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.body}>
                                    <AppSettingsContext.Provider value={NON_STANDALONE_CONTEXT_VALUE}>
                                        {renderApp(app.key, onClose, false)}
                                    </AppSettingsContext.Provider>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        borderBottomWidth: 1,
        borderBottomColor: colors.listSeparator,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appName: {
        color: colors.text,
        fontSize: textSizes.listEntry,
        fontWeight: '500',
    },
    badge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 12,
    },
    chevron: {
        color: colors.text,
        fontSize: textSizes.normalText,
        fontWeight: 'bold',
    },
    chevronExpanded: {
        transform: [{ rotate: '90deg' }],
    },
    body: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
});
